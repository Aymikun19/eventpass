import { requireUser } from "@/lib/supabase/server";
import { Scanner } from "./Scanner";

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  return <Scanner eventId={id} />;
}
