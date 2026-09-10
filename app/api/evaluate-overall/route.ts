import { NextRequest, NextResponse } from "next/server";
import { callQwen, safeParseJSON } from "@/lib/qwen";
import { getOverallEvaluationPrompt } from "@/lib/prompts";
import { OverallEvaluationRequest, OverallEvaluation } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: OverallEvaluationRequest = await request.json();
    const { config, skillResults, lang } = body;

    if (!config?.jobTitle || !Array.isArray(skillResults) || skillResults.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: missing config or skill results." },
        { status: 400 }
      );
    }

    const systemPrompt = getOverallEvaluationPrompt(lang);

    const interviewData = skillResults.map((skill) => ({
      skill: skill.name,
      averageScore: skill.averageScore,
      questions: skill.questions.map((q) => ({
        question: q.question,
        attempts: q.attempts.map((a) => ({
          answer: a.answer,
          score: a.evaluation.score,
          evaluation: a.evaluation.evaluation,
          notes: a.evaluation.notes,
        })),
        finalScore: q.finalScore,
      })),
    }));

    const userMessage = `Evaluate this completed interview for the position "${config.jobTitle}":\n\n${JSON.stringify(interviewData, null, 2)}`;
    const responseText = await callQwen(systemPrompt, userMessage, { useBackup: true });
    const evaluation = safeParseJSON<OverallEvaluation>(responseText);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("evaluate-overall error:", error);
    return NextResponse.json(
      { error: "Failed to generate evaluation report." },
      { status: 500 }
    );
  }
}
