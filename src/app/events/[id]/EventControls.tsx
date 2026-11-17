"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useRef } from "react";
import { deleteEvent, updateEvent } from "@/app/actions";
import { EventForm } from "@/app/EventForm";

type Ev = { id: string; title: string; description: string | null; venue: string | null; starts_at: string; capacity: number };

export function EventControls({ ev }: { ev: Ev }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn-outline" onClick={() => dialog.current?.showModal()}>
        <Pencil size={15} aria-hidden /> Edit
      </button>
      <form
        action={deleteEvent.bind(null, ev.id)}
        onSubmit={(e) => {
          if (!confirm(`Delete “${ev.title}” and all its registrations? This cannot be undone.`)) e.preventDefault();
        }}
      >
        <button className="btn-outline hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700" aria-label="Delete event">
          <Trash2 size={15} aria-hidden />
        </button>
      </form>
      <dialog ref={dialog} className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-stone-900/40">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="font-semibold">Edit event</h2>
          <button type="button" className="btn-ghost !p-2" aria-label="Close" onClick={() => dialog.current?.close()}><X size={16} aria-hidden /></button>
        </div>
        <div className="p-6">
          <EventForm action={updateEvent.bind(null, ev.id)} initial={ev} onSaved={() => dialog.current?.close()} />
        </div>
      </dialog>
    </>
  );
}
