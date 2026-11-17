import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/supabase/config";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** An .ics file so attendees can add the event to any calendar app. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("id, title, description, venue, starts_at").eq("slug", slug).maybeSingle();
  if (!ev) return new Response("Not found", { status: 404 });
  const start = new Date(ev.starts_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventPass//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@eventpass`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.venue ? `LOCATION:${esc(ev.venue)}` : "",
    `DESCRIPTION:${esc((ev.description ? ev.description + "\n\n" : "") + `${SITE_URL}/e/${slug}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.ics"` } });
}
