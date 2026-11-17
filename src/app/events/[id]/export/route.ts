import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const { data: ev } = await supabase.from("events").select("slug").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!ev) return new Response("Not found", { status: 404 });
  const { data } = await supabase.from("registrations").select("name, email, created_at, checked_in_at").eq("event_id", id).order("created_at");
  return csvResponse(`${ev.slug}-attendees.csv`, [
    ["Name", "Email", "Registered at", "Checked in at"],
    ...(data ?? []).map((r) => [r.name, r.email, r.created_at, r.checked_in_at]),
  ]);
}
