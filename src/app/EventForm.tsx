"use client";

import { useActionState } from "react";
import { CalendarPlus, Save } from "lucide-react";

type Initial = { title: string; description: string | null; venue: string | null; starts_at: string; capacity: number };

export function EventForm({
  action: serverAction,
  initial,
  onSaved,
}: {
  action: (prev: { error?: string; ok?: boolean }, form: FormData) => Promise<{ error?: string; ok?: boolean }>;
  initial?: Initial;
  onSaved?: () => void;
}) {
  const [state, action, pending] = useActionState<{ error?: string; ok?: boolean }, FormData>(async (p, f) => {
    const r = await serverAction(p, f);
    if (r.ok) onSaved?.();
    return r;
  }, {});
  return (
    <form action={action} className="grid gap-4">
      <label className="field"><span>Title</span><input name="title" required defaultValue={initial?.title} placeholder="Launchpad: Build with AWS" /></label>
      <label className="field"><span>Description</span><textarea name="description" rows={3} defaultValue={initial?.description ?? ""} placeholder="What attendees should know" /></label>
      <label className="field"><span>Venue</span><input name="venue" defaultValue={initial?.venue ?? ""} placeholder="Main Auditorium" /></label>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <label className="field"><span>Starts (Lagos time)</span><input name="starts_at" type="datetime-local" required defaultValue={initial?.starts_at} /></label>
        <label className="field"><span>Capacity</span><input name="capacity" type="number" min={1} defaultValue={initial?.capacity ?? 100} /></label>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn" disabled={pending}>
        {initial ? <Save size={16} aria-hidden /> : <CalendarPlus size={16} aria-hidden />}
        {pending ? "Saving…" : initial ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}
