import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await getStore();
  const jobIndex = store.jobs.findIndex((j) => j.id === id);

  if (jobIndex === -1) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  store.jobs.splice(jobIndex, 1);
  store.candidates = store.candidates.filter((c) => c.jobId !== id);
  await saveStore(store);

  return NextResponse.json({ success: true });
}
