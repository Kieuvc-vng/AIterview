import { NextRequest, NextResponse } from "next/server";
import { getStore, saveStore, generateId } from "@/lib/store";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({ jobs: store.jobs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, jobTitle, lang, skills } = body;

  if (!name?.trim() || !jobTitle || !skills?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const store = await getStore();
  const job = {
    id: generateId(),
    name: name.trim(),
    jobTitle,
    lang,
    skills,
    createdAt: new Date().toISOString(),
  };
  store.jobs.push(job);
  await saveStore(store);

  return NextResponse.json({ job }, { status: 201 });
}
