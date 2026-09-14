import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore, generateId } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await getStore();
  const candidates = store.candidates.filter((c) => c.jobId === id);
  return NextResponse.json({ candidates });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { candidateName } = body;

  if (!candidateName?.trim()) {
    return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
  }

  const store = await getStore();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const candidate = {
    id: generateId(),
    jobId: id,
    candidateName: candidateName.trim(),
    createdAt: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await saveStore(store);

  const baseUrl = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin;
  const url = `${baseUrl}/c/${candidate.id}`;

  return NextResponse.json({ candidate, url }, { status: 201 });
}
