import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/slug";
import { NewEventForm } from "./NewEventForm";

export default async function Home() {
  const { supabase, user } = await requireUser();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, registrations(count)")
    .eq("owner_id", user.id)
    .order("starts_at", { ascending: false });

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <div>
        <h1 className="text-2xl font-semibold">Your events</h1>
        <div className="mt-4 grid gap-3">
          {(events ?? []).length === 0 && <p className="card p-6 text-sm text-stone-500">No events yet. Create one →</p>}
          {(events ?? []).map((e) => {
            const count = (e.registrations as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <Link key={e.id} href={`/events/${e.id}`} className="card p-4 hover:border-accent">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-stone-500">{fmtDate(e.starts_at)}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(100, (count / e.capacity) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {count}/{e.capacity} registered
                </p>
              </Link>
            );
          })}
        </div>
      </div>
      <NewEventForm />
    </div>
  );
}
