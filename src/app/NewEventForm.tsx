"use client";

import { createEvent } from "./actions";
import { EventForm } from "./EventForm";

export function NewEventForm() {
  return (
    <section className="card h-fit p-6" aria-labelledby="new-event">
      <h2 id="new-event" className="mb-4 font-semibold">New event</h2>
      <EventForm action={createEvent} />
    </section>
  );
}
