"use client";

import { CircleCheck, CircleX } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { checkIn, type CheckInResult } from "@/app/actions";

export function Scanner({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [manual, setManual] = useState("");
  const busy = useRef(false);

  async function handle(code: string) {
    if (busy.current) return;
    busy.current = true;
    setResult(await checkIn(eventId, code.trim()));
    setTimeout(() => (busy.current = false), 2000); // avoid double scans
  }

  useEffect(() => {
    const qr = new Html5Qrcode("reader");
    qr.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, handle, () => {}).catch(() => {
      setResult(null);
    });
    return () => {
      qr.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tone =
    result?.status === "ok" ? "bg-emerald-600" : result?.status === "already" ? "bg-amber-500" : "bg-red-600";

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <h1 className="text-xl font-semibold">Door scanner</h1>
      <div id="reader" className="overflow-hidden rounded-2xl bg-black" />
      {result && (
        <div className={`rounded-2xl p-5 text-center text-white ${tone}`}>
          {result.status === "ok" && (
            <p className="inline-flex items-center gap-2 text-lg font-semibold">
              <CircleCheck size={22} aria-hidden /> Welcome, {result.name}!
            </p>
          )}
          {result.status === "already" && (
            <p className="text-lg font-semibold">
              {result.name} already checked in at {new Date(result.at).toLocaleTimeString("en-NG")}
            </p>
          )}
          {result.status === "invalid" && (
            <p className="inline-flex items-center gap-2 text-lg font-semibold">
              <CircleX size={22} aria-hidden /> Invalid ticket for this event
            </p>
          )}
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handle(manual);
          setManual("");
        }}
      >
        <input className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm" placeholder="Or paste a ticket code" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn">Check in</button>
      </form>
    </div>
  );
}
