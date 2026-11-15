"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, requireUser } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { sendTicketEmail } from "@/lib/ticket-email";

const eventSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().optional(),
  venue: z.string().trim().optional(),
  starts_at: z.string().min(1, "Pick a date and time"),
  capacity: z.coerce.number().int().min(1).max(100000),
});

export async function createEvent(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const parsed = eventSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // datetime-local has no timezone; treat it as Lagos time (UTC+1).
  const startsAt = new Date(parsed.data.starts_at + ":00+01:00").toISOString();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...parsed.data, starts_at: startsAt, slug: slugify(parsed.data.title) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  redirect(`/events/${data.id}`);
}

export type RegisterState = { error?: string; code?: string; emailed?: boolean; again?: boolean };

export async function register(slug: string, _prev: RegisterState, form: FormData): Promise<RegisterState> {
  const parsed = z
    .object({ name: z.string().trim().min(2), email: z.email() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your name and a valid email." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("register_for_event", { p_slug: slug, p_name: parsed.data.name, p_email: parsed.data.email })
    .single<{ ticket_code: string; event_title: string; already_registered: boolean }>();
  if (error || !data) return { error: error?.message ?? "Could not register" };

  const { data: ev } = await supabase.from("events").select("venue, starts_at").eq("slug", slug).single();
  const mail = await sendTicketEmail({
    to: parsed.data.email,
    name: parsed.data.name,
    code: data.ticket_code,
    eventTitle: data.event_title,
    venue: ev?.venue ?? null,
    startsAt: ev?.starts_at ?? new Date().toISOString(),
  });
  return { code: data.ticket_code, emailed: mail.ok, again: data.already_registered };
}

export type CheckInResult =
  | { status: "ok"; name: string }
  | { status: "already"; name: string; at: string }
  | { status: "invalid" };

export async function checkIn(eventId: string, code: string): Promise<CheckInResult> {
  const { supabase } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(code)) return { status: "invalid" };
  const { data: reg } = await supabase
    .from("registrations")
    .select("id, name, checked_in_at")
    .eq("event_id", eventId)
    .eq("ticket_code", code)
    .maybeSingle();
  if (!reg) return { status: "invalid" }; // wrong event, or not the owner (RLS)
  if (reg.checked_in_at) return { status: "already", name: reg.name, at: reg.checked_in_at };
  await supabase.from("registrations").update({ checked_in_at: new Date().toISOString() }).eq("id", reg.id);
  revalidatePath(`/events/${eventId}`);
  return { status: "ok", name: reg.name };
}
