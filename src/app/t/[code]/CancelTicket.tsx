"use client";

import { XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { cancelTicket } from "@/app/actions";

export function CancelTicket({ code, waitlisted }: { code: string; waitlisted: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-6 grid justify-items-center gap-2">
      <button type="button" disabled={pending} className="btn-ghost text-sm text-stone-500 hover:!text-red-600"
        onClick={() => {
          if (!confirm(waitlisted ? "Leave the waitlist?" : "Cancel your ticket? Your spot goes to the next person on the waitlist.")) return;
          start(async () => { const r = await cancelTicket(code); if (r.error) setError(r.error); });
        }}>
        <XCircle size={15} aria-hidden /> {pending ? "Cancelling…" : waitlisted ? "Leave the waitlist" : "I can't make it, cancel my ticket"}
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
