"use client";

import { Search, UserCheck, UserX } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { setCheckedIn } from "@/app/actions";

type Reg = { id: string; name: string; email: string; checked_in_at: string | null; created_at: string; status: string };

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });

export function GuestList({ eventId, regs }: { eventId: string; regs: Reg[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "waitlisted" | "cancelled">("all");
  const [pending, start] = useTransition();
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return regs.filter(
      (r) =>
        (!t || r.name.toLowerCase().includes(t) || r.email.toLowerCase().includes(t)) &&
        (filter === "all"
          ? r.status !== "cancelled"
          : filter === "waitlisted" || filter === "cancelled"
            ? r.status === filter
            : r.status === "confirmed" && (filter === "in" ? r.checked_in_at : !r.checked_in_at)),
    );
  }, [regs, q, filter]);

  return (
    <section className="card overflow-hidden" aria-labelledby="guests">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4">
        <h2 id="guests" className="font-semibold">Guest list <span className="font-normal text-stone-500">({regs.filter((r) => r.status === "confirmed").length})</span></h2>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Search guests</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="input !w-56 !py-2 pl-9" />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="input !w-auto !py-2" aria-label="Filter by status">
            <option value="all">Everyone</option>
            <option value="in">Checked in</option>
            <option value="out">Not yet</option>
            <option value="waitlisted">Waitlist</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Action</th></tr>
          </thead>
          <tbody aria-busy={pending}>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-stone-500">{r.email}</td>
                <td className="px-4 py-3">
                  {r.status === "waitlisted" ? (
                    <span className="badge !bg-amber-100 !text-amber-800">Waitlist</span>
                  ) : r.status === "cancelled" ? (
                    <span className="badge !bg-stone-200 !text-stone-500">Cancelled</span>
                  ) : r.checked_in_at ? (
                    <span className="badge !bg-emerald-100 !text-emerald-800">In at {time(r.checked_in_at)}</span>
                  ) : (
                    <span className="badge">Registered</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "confirmed" && <button
                    type="button"
                    disabled={pending}
                    onClick={() => start(() => setCheckedIn(eventId, r.id, !r.checked_in_at))}
                    className="btn-ghost !py-1.5 text-xs"
                  >
                    {r.checked_in_at ? <><UserX size={14} aria-hidden /> Undo</> : <><UserCheck size={14} aria-hidden /> Check in</>}
                  </button>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-stone-500">{regs.length ? "No guests match." : "No registrations yet. Share your link to get started."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
