import { CalendarPlus, Hourglass } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/slug";
import { CancelTicket } from "./CancelTicket";

type T = { name: string; event_title: string; venue: string | null; starts_at: string; checked_in_at: string | null; status: string; waitlist_position: number | null; slug: string };

export default async function Ticket({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(code)) notFound();
  const supabase = await createClient();
  const { data: t } = await supabase.rpc("get_ticket", { p_code: code }).maybeSingle<T>();
  if (!t) notFound();
  const upcoming = new Date(t.starts_at) > new Date();

  if (t.status === "cancelled") {
    return (
      <div className="card mx-auto max-w-sm p-8 text-center">
        <h1 className="text-xl font-semibold">Ticket cancelled</h1>
        <p className="mt-2 text-sm text-stone-500">Your registration for {t.event_title} was cancelled.</p>
        {upcoming && <Link href={`/e/${t.slug}`} className="btn mt-4">Register again</Link>}
      </div>
    );
  }

  const waitlisted = t.status === "waitlisted";
  const svg = waitlisted ? null : await QRCode.toString(code, { type: "svg", margin: 1 });
  return (
    <div className="mx-auto max-w-sm">
      <div className="card overflow-hidden text-center">
        <div className={`${waitlisted ? "bg-stone-800" : "bg-accent"} p-5 text-white`}>
          <p className="text-xs uppercase tracking-widest opacity-80">{waitlisted ? "Waitlist" : "Admit one"}</p>
          <h1 className="mt-1 text-xl font-bold">{t.event_title}</h1>
        </div>
        <div className="p-6">
          {waitlisted ? (
            <div className="grid justify-items-center gap-2 py-4">
              <Hourglass size={36} className="text-accent" aria-hidden />
              <p className="text-3xl font-bold">#{t.waitlist_position}</p>
              <p className="text-sm text-stone-500">in line. If someone cancels, you move up and we email your ticket.</p>
            </div>
          ) : (
            <div className="mx-auto w-56" dangerouslySetInnerHTML={{ __html: svg! }} />
          )}
          <p className="mt-4 font-semibold">{t.name}</p>
          <p className="text-sm text-stone-500">{fmtDate(t.starts_at)}</p>
          {t.venue && <p className="text-sm text-stone-500">{t.venue}</p>}
          {t.checked_in_at && <p className="badge mt-3 inline-block !bg-emerald-100 !text-emerald-800">Checked in</p>}
        </div>
      </div>
      {!waitlisted && <p className="mt-4 text-center text-sm text-stone-500">Show this QR code at the door. A screenshot works too.</p>}
      {upcoming && (
        <div className="mt-3 flex justify-center">
          <a href={`/e/${t.slug}/calendar`} className="btn-outline"><CalendarPlus size={15} aria-hidden /> Add to calendar</a>
        </div>
      )}
      {upcoming && !t.checked_in_at && <CancelTicket code={code} waitlisted={waitlisted} />}
    </div>
  );
}
