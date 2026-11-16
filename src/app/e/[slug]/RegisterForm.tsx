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
        <p className="mt-2 text-lg font-semibold">{state.again ? "You were already registered" : "You're registered!"}</p>
        <p className="mt-2 text-sm text-stone-500">
          {state.emailed ? "Your QR ticket is on its way to your inbox." : "Save your ticket below."}
        </p>
        <Link className="btn mt-4" href={`/t/${state.code}`}>
          <Ticket size={16} aria-hidden /> View my ticket
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="card grid gap-3 p-6">
      <label className="field"><span>Full name</span><input name="name" required /></label>
      <label className="field"><span>Email</span><input name="email" type="email" required /></label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Registering…" : "Get my ticket"}</button>
    </form>
  );
}
