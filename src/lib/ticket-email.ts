import "server-only";
import QRCode from "qrcode";
import { fmtDate } from "./slug";

/** Sends the attendee their ticket with the QR code attached and embedded inline (CID). */
export async function sendTicketEmail(opts: {
  to: string;
  name: string;
  code: string;
  eventTitle: string;
  venue: string | null;
  startsAt: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const png = await QRCode.toBuffer(opts.code, { width: 360, margin: 1 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.TICKET_FROM_EMAIL ?? "EventPass <onboarding@resend.dev>",
      to: opts.to,
      subject: `Your ticket: ${opts.eventTitle}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;text-align:center">
          <h2>You're in, ${opts.name.split(" ")[0]}! 🎟️</h2>
          <p><b>${opts.eventTitle}</b><br>${fmtDate(opts.startsAt)}${opts.venue ? `<br>${opts.venue}` : ""}</p>
          <img src="cid:ticket-qr" width="240" height="240" alt="Ticket QR code" />
          <p>Show this QR code at the door.</p>
          <p><a href="${site}/t/${opts.code}">Open your ticket online</a></p>
        </div>`,
      attachments: [{ filename: "ticket.png", content: png.toString("base64"), content_id: "ticket-qr" }],
    }),
  });
  return res.ok ? { ok: true } : { ok: false, error: await res.text() };
}
