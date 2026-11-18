"use client";

import { CircleCheck, Ticket } from "lucide-react";

import Link from "next/link";
import { useActionState } from "react";
import { register, type RegisterState } from "@/app/actions";

export function RegisterForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(register.bind(null, slug), {} as RegisterState);
  if (state.code) {
    return (
      <div className="card p-6 text-center">
        <CircleCheck size={40} className="mx-auto text-accent" aria-hidden />
        <p className="mt-2 text-lg font-semibold">
          {state.waitlisted ? (state.again ? "You're already on the waitlist" : "You're on the waitlist") : state.again ? "You were already registered" : "You're registered!"}
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {state.waitlisted
            ? "The event is full. If someone cancels, you move up automatically and we email you."
            : state.emailed ? "Your QR ticket is on its way to your inbox." : "Save your ticket below."}
        </p>
        <Link className="btn mt-4" href={`/t/${state.code}`}>
          <Ticket size={16} aria-hidden /> {state.waitlisted ? "Check my place in line" : "View my ticket"}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="card grid gap-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Register</h2>
        <p className="text-sm text-stone-500">Free. Your QR ticket arrives by email. If it is full, you join the waitlist.</p>
      </div>
      <label className="field"><span>Full name</span><input name="name" required autoComplete="name" /></label>
      <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn !py-3" disabled={pending}><Ticket size={16} aria-hidden /> {pending ? "Registering…" : "Get my ticket"}</button>
    </form>
  );
}
