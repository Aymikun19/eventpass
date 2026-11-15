import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/slug";
import { RegisterForm } from "./RegisterForm";

export default async function PublicEvent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!ev) notFound();
  const closed = new Date(ev.starts_at) < new Date();
  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <div>
        <p className="text-sm font-medium text-accent">{fmtDate(ev.starts_at)}</p>
        <h1 className="mt-1 text-3xl font-bold">{ev.title}</h1>
        {ev.venue && <p className="mt-1 text-stone-500">📍 {ev.venue}</p>}
        {ev.description && <p className="mt-4 whitespace-pre-wrap text-stone-700">{ev.description}</p>}
      </div>
      {closed ? <p className="card p-5 text-center text-stone-500">Registration has closed.</p> : <RegisterForm slug={slug} />}
    </div>
  );
}
