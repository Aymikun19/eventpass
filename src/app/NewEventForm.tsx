"use client";

import { useActionState } from "react";
import { createEvent } from "./actions";

export function NewEventForm() {
  const [state, action, pending] = useActionState(createEvent, {} as { error?: string });
  return (
    <form action={action} className="card grid h-fit gap-3 p-5">
      <h2 className="font-semibold">New event</h2>
      <label className="field"><span>Title</span><input name="title" required /></label>
      <label className="field"><span>Description</span><textarea name="description" rows={3} /></label>
      <label className="field"><span>Venue</span><input name="venue" placeholder="Main Auditorium" /></label>
      <label className="field"><span>Starts (Lagos time)</span><input name="starts_at" type="datetime-local" required /></label>
      <label className="field"><span>Capacity</span><input name="capacity" type="number" min={1} defaultValue={100} /></label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Creating…" : "Create event"}</button>
    </form>
  );
}
