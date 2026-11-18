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

export type RegisterState = { error?: string; code?: string; emailed?: boolean; again?: boolean; waitlisted?: boolean };

export async function register(slug: string, _prev: RegisterState, form: FormData): Promise<RegisterState> {
  const parsed = z
    .object({ name: z.string().trim().min(2), email: z.email() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your name and a valid email." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("register_for_event", { p_slug: slug, p_name: parsed.data.name, p_email: parsed.data.email })
    .single<{ ticket_code: string; event_title: string; already_registered: boolean; waitlisted: boolean }>();
  if (error || !data) return { error: error?.message ?? "Could not register" };

  const { data: ev } = await supabase.from("events").select("venue, starts_at").eq("slug", slug).single();
  const mail = await sendTicketEmail({
    to: parsed.data.email,
    name: parsed.data.name,
    code: data.ticket_code,
    eventTitle: data.event_title,
    venue: ev?.venue ?? null,
    startsAt: ev?.starts_at ?? new Date().toISOString(),
    kind: data.waitlisted ? "waitlist" : "ticket",
  });
  return { code: data.ticket_code, emailed: mail.ok, again: data.already_registered, waitlisted: data.waitlisted };
}

/** Attendee cancels with their ticket code; the first person on the waitlist is promoted and emailed. */
export async function cancelTicket(code: string): Promise<{ error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(code)) return { error: "Invalid ticket" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_registration", { p_code: code });
  if (error) return { error: error.message };
  const promoted = (data ?? [])[0] as
    | { promoted_code: string; promoted_name: string; promoted_email: string; event_title: string; venue: string | null; starts_at: string }
    | undefined;
  if (promoted) {
    await sendTicketEmail({
      to: promoted.promoted_email, name: promoted.promoted_name, code: promoted.promoted_code,
      eventTitle: promoted.event_title, venue: promoted.venue, startsAt: promoted.starts_at, kind: "promoted",
    });
  }
  revalidatePath(`/t/${code}`);
  return {};
}

export type CheckInResult =
  | { status: "ok"; name: string }
  | { status: "already"; name: string; at: string }
  | { status: "not-confirmed"; name: string; reason: string }
  | { status: "invalid" };

export async function checkIn(eventId: string, code: string): Promise<CheckInResult> {
  const { supabase } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(code)) return { status: "invalid" };
  const { data: reg } = await supabase
    .from("registrations")
    .select("id, name, checked_in_at, status")
    .eq("event_id", eventId)
    .eq("ticket_code", code)
    .maybeSingle();
  if (!reg) return { status: "invalid" }; // wrong event, or not the owner (RLS)
  if (reg.status !== "confirmed") return { status: "not-confirmed", name: reg.name, reason: reg.status === "waitlisted" ? "On the waitlist, not confirmed" : "This ticket was cancelled" };
  if (reg.checked_in_at) return { status: "already", name: reg.name, at: reg.checked_in_at };
  await supabase.from("registrations").update({ checked_in_at: new Date().toISOString() }).eq("id", reg.id);
  revalidatePath(`/events/${eventId}`);
  return { status: "ok", name: reg.name };
}

export async function updateEvent(id: string, _prev: { error?: string; ok?: boolean }, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const { supabase } = await requireUser();
  const parsed = eventSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const startsAt = new Date(parsed.data.starts_at + ":00+01:00").toISOString();
  const { error } = await supabase.from("events").update({ ...parsed.data, starts_at: startsAt }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/events/${id}`);
  return { ok: true };
}

export async function deleteEvent(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}

/** Manual check-in (or undo) from the guest list. */
export async function setCheckedIn(eventId: string, registrationId: string, checked: boolean) {
  const { supabase } = await requireUser();
  await supabase
    .from("registrations")
    .update({ checked_in_at: checked ? new Date().toISOString() : null })
    .eq("id", registrationId)
    .eq("event_id", eventId);
  revalidatePath(`/events/${eventId}`);
}
