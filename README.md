<img src="public/logo.svg" alt="" width="64" height="64">

# EventPass: QR Tickets & Door Check-in

Run free events without spreadsheets. Organisers create an event and share a link. Attendees register and get an **emailed QR ticket**. At the door, any phone becomes a **scanner** that checks people in live.

Built for the student tech events I organise as Technical Lead of the AWS Student Builder Group.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e) ![Resend](https://img.shields.io/badge/email-Resend-000)

## Features

- **Public registration page** per event (`/e/<slug>`) with a live capacity check
- **QR tickets by email** through Resend, with the QR embedded inline (CID) and attached as a PNG
- **Ticket page** (`/t/<code>`) as a backup if the email goes to spam
- **Door scanner** (`/events/<id>/scan`) using the phone camera, with a clear green/amber/red result and duplicate-scan protection
- **Organiser dashboard** with registered, checked-in and turnout stats

## Interesting bits

- **Race-free capacity**: registration runs in a Postgres function (`register_for_event`) that locks the event row (`SELECT … FOR UPDATE`), so two people can't grab the last seat at once. Registering twice returns the same ticket.
- **Least-privilege reads**: attendees never query `registrations` directly. A `security definer` function returns only what's printed on the ticket. RLS lets only the event owner see or check in attendees.
- **Check-in is authorised server-side**: the scanner calls a Server Action that verifies the ticket belongs to *this* event *and* that the caller owns it.

## Run it

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql).
2. `cp .env.example .env.local` and fill in Supabase and Resend keys. To email attendees, `TICKET_FROM_EMAIL` must use a domain verified in Resend.
3. Start the app:

```bash
npm install && npm run dev
```

The camera scanner needs HTTPS (or `localhost`).

## Database schema

All tables live in their own Postgres schema, `eventpass`, rather than `public`, so this app can share one Supabase project with my other demo apps. After running `supabase/schema.sql`, add `eventpass` under **Supabase → Project Settings → Data API → Exposed schemas**. The app selects it through `db: { schema }` in `src/lib/supabase/config.ts`.
