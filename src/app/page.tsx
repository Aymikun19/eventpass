import { CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { lagosParts } from "@/lib/slug";
import { Landing } from "@/components/kit/Landing";
import { Meter } from "@/components/kit/Charts";
import { EmptyState, Stat } from "@/components/kit/Stat";
import { NewEventForm } from "./NewEventForm";

type Row = { id: string; title: string; venue: string | null; starts_at: string; capacity: number; registrations: { count: number }[] };

export default async function Home() {
  const { supabase, user } = await getUser();
  if (!user) return <Landing />;
  const { data } = await supabase
    .from("events")
    .select("id, title, venue, starts_at, capacity, registrations(count)")
    .eq("owner_id", user.id)
    .eq("registrations.status", "confirmed")
    .order("starts_at", { ascending: true });
  const events = (data ?? []) as unknown as Row[];
  const now = new Date().toISOString();
  const upcoming = events.filter((e) => e.starts_at >= now);
  const past = events.filter((e) => e.starts_at < now).reverse();
  const total = events.reduce((n, e) => n + (e.registrations[0]?.count ?? 0), 0);

  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Organiser</p>
        <h1 className="page-title mt-1">Your events</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={CalendarDays} label="Upcoming" value={String(upcoming.length)} />
        <Stat icon={CalendarDays} label="Past events" value={String(past.length)} />
        <Stat icon={Users} label="Total registrations" value={String(total)} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid h-fit gap-8">
          <EventList title="Upcoming" events={upcoming} empty="No upcoming events. Create one with the form." />
          {past.length > 0 && <EventList title="Past" events={past} muted />}
        </div>
        <NewEventForm />
      </div>
    </div>
  );
}

function EventList({ title, events, empty, muted }: { title: string; events: Row[]; empty?: string; muted?: boolean }) {
  return (
    <section className="grid gap-3" aria-label={`${title} events`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
      {events.length === 0 && empty && <EmptyState icon={CalendarDays} title="Nothing scheduled" text={empty} />}
      {events.map((e) => {
        const count = e.registrations[0]?.count ?? 0;
        const p = lagosParts(e.starts_at);
        return (
          <Link key={e.id} href={`/events/${e.id}`} className={`card flex gap-4 p-4 transition hover:-translate-y-0.5 hover:border-accent ${muted ? "opacity-75" : ""}`}>
            <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-accent/10 py-2 text-accent">
              <span className="text-[11px] font-semibold">{p.month}</span>
              <span className="text-xl font-bold leading-none">{p.day}</span>
            </div>
            <div className="grid min-w-0 flex-1 gap-1.5">
              <p className="truncate font-semibold">{e.title}</p>
              <p className="flex items-center gap-1.5 truncate text-sm text-stone-500">
                <MapPin size={13} aria-hidden /> {e.venue || "Venue to be announced"} · {p.time}
              </p>
              <Meter value={count} max={e.capacity} label={`${count} of ${e.capacity} registered`} />
              <p className="text-xs text-stone-500">{count}/{e.capacity} registered</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
