import { ScanLine } from "lucide-react";
import { SITE_URL } from "@/lib/supabase/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/slug";

export default async function EventAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: ev } = await supabase.from("events").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!ev) notFound();
  const { data: regs } = await supabase
    .from("registrations")
    .select("id, name, email, checked_in_at, created_at")
    .eq("event_id", id)
    .order("created_at");
  const list = regs ?? [];
  const checked = list.filter((r) => r.checked_in_at).length;
  const site = SITE_URL;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{ev.title}</h1>
          <p className="text-sm text-stone-500">{fmtDate(ev.starts_at)} · {ev.venue}</p>
        </div>
        <Link href={`/events/${id}/scan`} className="btn">
          <ScanLine size={16} aria-hidden /> Open door scanner
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Registered" value={`${list.length} / ${ev.capacity}`} />
        <Stat label="Checked in" value={String(checked)} />
        <Stat label="Turnout" value={list.length ? `${Math.round((checked / list.length) * 100)}%` : "—"} />
      </div>

      <div className="card p-4 text-sm">
        Public registration link:{" "}
        <a className="font-medium text-accent underline" href={`/e/${ev.slug}`}>{site}/e/{ev.slug}</a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-stone-500">{r.email}</td>
                <td className="p-3">
                  {r.checked_in_at ? <span className="badge !bg-emerald-100 !text-emerald-800">Checked in</span> : <span className="badge">Registered</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
