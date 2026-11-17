import { CalendarClock, CalendarPlus, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, lagosParts } from "@/lib/slug";
import { RegisterForm } from "./RegisterForm";

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ev = await load((await params).slug);
  return ev ? { title: ev.title, description: ev.description ?? `Register for ${ev.title}` } : {};
}

export default async function PublicEvent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await load(slug);
  if (!ev) notFound();
  const closed = new Date(ev.starts_at) < new Date();
  const p = lagosParts(ev.starts_at);
  return (
    <div className="mx-auto grid max-w-4xl items-start gap-8 lg:grid-cols-[1fr_380px]">
      <article className="grid gap-6">
        <div className="flex items-center gap-4">
          <div className="grid w-16 shrink-0 place-items-center rounded-2xl bg-accent py-2.5 text-white">
            <span className="text-xs font-semibold">{p.month}</span>
            <span className="text-2xl font-bold leading-none">{p.day}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{ev.title}</h1>
        </div>
        <dl className="card grid gap-4 p-5 text-sm">
          <div className="flex gap-3"><dt className="sr-only">When</dt><CalendarClock size={18} className="text-accent" aria-hidden /><dd>{fmtDate(ev.starts_at)}</dd></div>
          {ev.venue && <div className="flex gap-3"><dt className="sr-only">Where</dt><MapPin size={18} className="text-accent" aria-hidden /><dd>{ev.venue}</dd></div>}
          <a href={`/e/${slug}/calendar`} className="btn-outline justify-self-start"><CalendarPlus size={15} aria-hidden /> Add to calendar</a>
        </dl>
        {ev.description && (
          <section>
            <h2 className="mb-2 font-semibold">About this event</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{ev.description}</p>
          </section>
        )}
      </article>
      <aside className="lg:sticky lg:top-24">
        {closed ? <p className="card p-6 text-center text-stone-500">Registration has closed.</p> : <RegisterForm slug={slug} />}
      </aside>
    </div>
  );
}
