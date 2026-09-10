import { NextRequest, NextResponse } from "next/server";
import { callQwen } from "@/lib/qwen";
import { getEvaluatePrompt } from "@/lib/prompts";
import { ChatEvaluation, ChatRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { conversation, skillName, originalQuestion, attemptNumber, lang } = body;

    const systemPrompt = getEvaluatePrompt(
      skillName,
      originalQuestion,
      attemptNumber,
      lang
    );

    const conversationText = conversation
      .map(
        (msg) =>
          `${msg.role === "interviewer" ? "Interviewer" : "Candidate"}: ${msg.content}`
      )
      .join("\n\n");

    const userMessage = `Evaluate this interview conversation:\n\n${conversationText}`;
    const responseText = await callQwen(systemPrompt, userMessage, { useBackup: true });
    const evaluation: ChatEvaluation = JSON.parse(responseText);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("chat error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate response. Please try again." },
      { status: 500 }
    );
  }
}
