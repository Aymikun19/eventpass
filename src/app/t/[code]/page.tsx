import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/slug";

export default async function Ticket({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase
    .rpc("get_ticket", { p_code: code })
    .maybeSingle<{ name: string; event_title: string; venue: string | null; starts_at: string; checked_in_at: string | null }>();
  if (!t) notFound();
  const svg = await QRCode.toString(code, { type: "svg", margin: 1 });
  return (
    <div className="mx-auto max-w-sm">
      <div className="card overflow-hidden text-center">
        <div className="bg-accent p-5 text-white">
          <p className="text-xs uppercase tracking-widest opacity-80">Admit one</p>
          <h1 className="mt-1 text-xl font-bold">{t.event_title}</h1>
        </div>
        <div className="p-6">
          <div className="mx-auto w-56" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="mt-4 font-semibold">{t.name}</p>
          <p className="text-sm text-stone-500">{fmtDate(t.starts_at)}</p>
          {t.venue && <p className="text-sm text-stone-500">{t.venue}</p>}
          {t.checked_in_at && <p className="badge mt-3 inline-block !bg-emerald-100 !text-emerald-800">Checked in</p>}
        </div>
      </div>
    </div>
  );
}
