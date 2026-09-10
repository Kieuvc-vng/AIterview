import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { getAnalyzeJDPrompt } from "@/lib/prompts";
import { AnalyzeJDResponse, Language } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jd, lang } = body as { jd: string; lang: Language };

    if (!jd || jd.trim().length < 50) {
      return NextResponse.json(
        { error: "JD is too short. Please provide more detail." },
        { status: 400 }
      );
    }

    const systemPrompt = getAnalyzeJDPrompt(lang);
    const userMessage = `Analyze this job description:\n\n${jd}`;
    const responseText = await callClaude(systemPrompt, userMessage);
    const result: AnalyzeJDResponse = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error("analyze-jd error:", error);
    return NextResponse.json(
      { error: "Failed to analyze JD. Please try again." },
      { status: 500 }
    );
  }
}
