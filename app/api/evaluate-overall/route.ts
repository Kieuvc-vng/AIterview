import { NextRequest, NextResponse } from "next/server";
import { callQwen } from "@/lib/qwen";
import { getOverallEvaluationPrompt } from "@/lib/prompts";
import { OverallEvaluationRequest, OverallEvaluation } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: OverallEvaluationRequest = await request.json();
    const { config, skillResults, lang } = body;

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
    const evaluation: OverallEvaluation = JSON.parse(responseText);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("evaluate-overall error:", error);
    return NextResponse.json(
      { error: "Failed to generate evaluation report." },
      { status: 500 }
    );
  }
}
