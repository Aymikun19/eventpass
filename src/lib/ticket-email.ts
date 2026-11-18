import "server-only";
import { SITE_URL } from "@/lib/supabase/config";
import QRCode from "qrcode";
import { fmtDate } from "./slug";

/** Sends the attendee their ticket with the QR code attached and embedded inline (CID). */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendTicketEmail(opts: {
  to: string;
  name: string;
  code: string;
  eventTitle: string;
  venue: string | null;
  startsAt: string;
  kind?: "ticket" | "waitlist" | "promoted";
}) {
  const kind = opts.kind ?? "ticket";
  const first = esc(opts.name.split(" ")[0]);
  const title = esc(opts.eventTitle);
  const venue = opts.venue ? esc(opts.venue) : "";
  const heading = kind === "waitlist" ? `You're on the waitlist, ${first}` : kind === "promoted" ? `Good news, ${first}: a spot opened up!` : `You're in, ${first}!`;
  const subject = kind === "waitlist" ? `Waitlist: ${opts.eventTitle}` : kind === "promoted" ? `You're in: ${opts.eventTitle}` : `Your ticket: ${opts.eventTitle}`;
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  const site = SITE_URL;
  const png = await QRCode.toBuffer(opts.code, { width: 360, margin: 1 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.TICKET_FROM_EMAIL ?? "EventPass <onboarding@resend.dev>",
      to: opts.to,
      subject,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;text-align:center">
          <h2>${heading}</h2>
          <p><b>${title}</b><br>${fmtDate(opts.startsAt)}${venue ? `<br>${venue}` : ""}</p>
          ${kind === "waitlist"
            ? "<p>The event is full right now. If someone cancels, you move up automatically and we email you your ticket.</p>"
            : `<img src="cid:ticket-qr" width="240" height="240" alt="Ticket QR code" /><p>Show this QR code at the door.</p>`}
          <p><a href="${site}/t/${opts.code}">${kind === "waitlist" ? "Check your place in line" : "Open your ticket online"}</a></p>
          <p style="color:#78716c;font-size:12px">Can't make it? Open the link above and cancel, so someone on the waitlist can have your spot.</p>
        </div>`,
      attachments: kind === "waitlist" ? [] : [{ filename: "ticket.png", content: png.toString("base64"), content_id: "ticket-qr" }],
    }),
  });
  return res.ok ? { ok: true } : { ok: false, error: await res.text() };
}
