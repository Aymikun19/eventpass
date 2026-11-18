import { CalendarClock, Download, MapPin, Percent, ScanLine, Ticket, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/server";
import { bucketByDay, bucketByHalfHour, fmtDate, toLagosInput } from "@/lib/slug";
import { BarChart, Meter } from "@/components/kit/Charts";
import { CopyButton } from "@/components/kit/CopyButton";
import { Stat } from "@/components/kit/Stat";
import { EventControls } from "./EventControls";
import { GuestList } from "./GuestList";

export default async function EventAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: ev } = await supabase.from("events").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!ev) notFound();
  const { data: regs } = await supabase
    .from("registrations")
    .select("id, name, email, checked_in_at, created_at, status")
    .eq("event_id", id)
    .order("created_at");
  const all = regs ?? [];
  const list = all.filter((r) => r.status === "confirmed");
  const waitlist = all.filter((r) => r.status === "waitlisted");
  const checkins = list.filter((r) => r.checked_in_at).map((r) => r.checked_in_at as string);
  const link = `${SITE_URL}/e/${ev.slug}`;
  const qr = await QRCode.toDataURL(link, { width: 480, margin: 1, color: { dark: "#1c1917", light: "#ffffff" } });
  const started = new Date(ev.starts_at) < new Date();
  const end = started ? new Date(ev.starts_at) : new Date();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/" className="text-sm text-stone-500 hover:text-accent">Your events</Link>
          <h1 className="page-title mt-1">{ev.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} aria-hidden /> {fmtDate(ev.starts_at)}</span>
            {ev.venue && <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden /> {ev.venue}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EventControls ev={{ ...ev, starts_at: toLagosInput(ev.starts_at) }} />
          <a href={`/events/${id}/export`} className="btn-outline"><Download size={15} aria-hidden /> CSV</a>
          <Link href={`/events/${id}/scan`} className="btn"><ScanLine size={16} aria-hidden /> Door scanner</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Registered" value={`${list.length}`} hint={`of ${ev.capacity} places`} />
        <Stat icon={UserCheck} label="Checked in" value={String(checkins.length)} hint={started ? "Event has started" : "Doors not open yet"} />
        <Stat icon={Percent} label="Turnout" value={list.length ? `${Math.round((checkins.length / list.length) * 100)}%` : "–"} hint="Checked in / registered" />
        <Stat icon={Ticket} label={waitlist.length ? "Waitlist" : "Places left"} value={String(waitlist.length ? waitlist.length : Math.max(0, ev.capacity - list.length))} hint={waitlist.length ? "Promoted automatically when someone cancels" : undefined} />
      </div>
      <Meter value={list.length} max={ev.capacity} label="Capacity used" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          <section className="card p-6" aria-labelledby="reg-chart">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 id="reg-chart" className="font-semibold">Registrations per day</h2>
              <span className="text-xs text-stone-500">{started ? "14 days before the event" : "Last 14 days"}</span>
            </div>
            <BarChart label="Registrations per day" height={120} data={bucketByDay(all.filter((r) => r.status !== "cancelled").map((r) => r.created_at), 14, end)} />
          </section>
          {checkins.length > 0 && (
            <section className="card p-6" aria-labelledby="arrivals">
              <h2 id="arrivals" className="mb-5 font-semibold">Arrivals (30-minute slots)</h2>
              <BarChart label="Check-ins per half hour" height={110} data={bucketByHalfHour(checkins)} />
            </section>
          )}
        </div>
        <section className="card grid h-fit gap-4 p-6" aria-labelledby="share">
          <h2 id="share" className="font-semibold">Share kit</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code linking to the registration page for ${ev.title}`} className="mx-auto w-48 rounded-xl border border-stone-200" />
          <p className="break-all rounded-xl bg-stone-50 px-3 py-2 font-mono text-xs text-stone-600">{link}</p>
          <div className="grid grid-cols-2 gap-2">
            <CopyButton value={link} label="Copy link" />
            <a href={qr} download={`${ev.slug}-qr.png`} className="btn-outline"><Download size={15} aria-hidden /> QR code</a>
          </div>
          <a href={`/e/${ev.slug}`} className="text-center text-sm text-accent hover:underline">Preview registration page</a>
        </section>
      </div>

      <GuestList eventId={id} regs={all} />
    </div>
  );
}
