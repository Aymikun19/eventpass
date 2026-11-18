import { ChartLine, FileDown, Mail, QrCode, ScanLine, Users } from "lucide-react";

export const brand = {
  name: "EventPass",
  short: "Event registration and QR check-in",
  eyebrow: "For student groups, meetups and conferences",
  tagline: "Registration and door check-in, handled.",
  description:
    "Publish a registration page in a minute. Every attendee gets a QR ticket by email, and your team checks people in at the door with any phone camera.",
  cta: { href: "/login?mode=signup", label: "Create your first event" },
  proof: ["No app to install", "Tickets sent automatically", "Live attendance count"],
  features: [
    { icon: Mail, title: "QR tickets by email", text: "Each registration triggers an email with a unique QR ticket that also works as a web page." },
    { icon: ScanLine, title: "Phone-camera scanner", text: "Open the scanner on any phone at the door. Duplicate and invalid tickets are flagged instantly." },
    { icon: ChartLine, title: "Live event dashboard", text: "Registrations, check-ins, capacity left and a check-in timeline that updates as people arrive." },
    { icon: Users, title: "Searchable guest list", text: "Find anyone by name or email and check them in by hand when they forget their ticket." },
    { icon: QrCode, title: "Share kit", text: "Copy the registration link or download a QR code for your flyers and WhatsApp groups." },
    { icon: FileDown, title: "Attendee export", text: "Download the full guest list with check-in times as a CSV spreadsheet." },
  ],
  steps: [
    ["Create the event", "Add a title, date, venue and capacity. Your public registration page is ready instantly."],
    ["Share the link", "Post the link or QR code anywhere. Attendees register and receive their tickets by email."],
    ["Scan at the door", "Open the scanner, point it at each ticket and watch attendance update live."],
  ] as [string, string][],
  closing: "Run your next event without the clipboard.",
  nav: [{ href: "/", label: "Events" }] as { href: string; label: string; public?: boolean }[],
  width: "max-w-5xl",
  repo: "https://github.com/Aymikun19/eventpass",
  preview: "/preview.webp" as string | null,
};
