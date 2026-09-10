import { Language } from "./types";

export function getAnalyzeJDPrompt(lang: Language): string {
  const outputLang = lang === "vi" ? "Vietnamese" : "English";
  return `You are an expert HR consultant who analyzes job descriptions.

Extract the key skills required and generate interview questions for each skill.

Rules:
- Extract 3-8 distinct skills from the JD
- For each skill, write a short description (1 sentence)
- For each skill, generate 2-5 interview questions
- All output text (skill names, descriptions, questions) must be in ${outputLang}
- Questions should assess practical knowledge, not just definitions
- Return ONLY valid JSON, no markdown fences or extra text

Return this exact JSON format:
{
  "jobTitle": "extracted job title",
  "skills": [
    {
      "name": "skill name",
      "description": "one sentence describing this skill requirement",
      "questions": ["question 1", "question 2", "question 3"]
    }
  ]
}`;
}

export function getEvaluatePrompt(
  skillName: string,
  originalQuestion: string,
  attemptNumber: number,
  lang: Language
): string {
  const outputLang = lang === "vi" ? "Vietnamese" : "English";
  return `You are an expert technical interviewer evaluating a candidate's response.

Context:
- Skill being assessed: ${skillName}
- Original question: ${originalQuestion}
- This is attempt ${attemptNumber} of 3

Evaluate the candidate's latest response in the conversation below.

Rules:
- "sufficient" = candidate demonstrated adequate understanding for this question
- "need_followup" = answer was vague, incomplete, or partially incorrect
- Follow-up questions should probe the specific weak area, not repeat the original question
- Score 1-5: 1=no understanding, 2=minimal, 3=adequate, 4=good, 5=excellent
- If attempt is 3, still evaluate honestly
- All output text must be in ${outputLang}
- Return ONLY valid JSON, no markdown fences or extra text

Return this exact JSON format:
{
  "evaluation": "sufficient" or "need_followup",
  "score": <number 1-5>,
  "followUpQuestion": "follow-up question if evaluation is need_followup, otherwise empty string",
  "notes": "brief evaluation notes"
}`;
}
