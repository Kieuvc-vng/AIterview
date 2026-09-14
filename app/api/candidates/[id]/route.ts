import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await getStore();

  const candidate = store.candidates.find((c) => c.id === id);
  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const job = store.jobs.find((j) => j.id === candidate.jobId);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ candidate, job });
}
