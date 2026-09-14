import { Language } from "./types";

export function getAnalyzeJDPrompt(lang: Language): string {
  const outputLang = lang === "vi" ? "Vietnamese" : "English";
  return `You are an expert HR consultant who analyzes job descriptions.

Extract the key skills required and generate interview questions for each skill.
Categorize each skill into one of three categories:
- "technical": hard/technical skills (programming languages, frameworks, tools, domain expertise)
- "soft": soft skills (communication, teamwork, leadership, problem-solving, time management)
- "other": other requirements (certifications, education, experience level, language proficiency)

Rules:
- Extract 3-10 distinct skills from the JD
- Each skill must have a "category" field with value "technical", "soft", or "other"
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
      "category": "technical" or "soft" or "other",
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

export function getOverallEvaluationPrompt(lang: Language): string {
  const outputLang = lang === "vi" ? "Vietnamese" : "English";
  return `You are a senior HR consultant reviewing a completed candidate interview.

Analyze all the interview data below and produce a comprehensive evaluation report.

Rules:
- Overall score is the weighted average of all skill scores (1-5 scale)
- Recommendation scale:
  - "Strong Yes" = overall 4.5-5.0
  - "Yes" = overall 3.5-4.4
  - "Maybe" = overall 2.5-3.4
  - "No" = overall 1.0-2.4
- For each skill, identify 1-3 specific strengths and 1-3 specific weaknesses based on actual answers
- Level per skill: "Excellent" (4.5-5), "Good" (3.5-4.4), "Average" (2.5-3.4), "Below Average" (1-2.4)
- The summary should be 2-3 sentences capturing the candidate's overall performance
- Interview notes should mention communication quality, response patterns, growth through follow-ups
- All output text must be in ${outputLang}
- Return ONLY valid JSON, no markdown fences or extra text

Return this exact JSON format:
{
  "overallScore": <number 1-5, one decimal>,
  "recommendation": "Strong Yes" or "Yes" or "Maybe" or "No",
  "summary": "2-3 sentence summary",
  "skillEvaluations": [
    {
      "skill": "skill name",
      "score": <number 1-5, one decimal>,
      "level": "Excellent" or "Good" or "Average" or "Below Average",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"],
      "notes": "brief skill-specific notes"
    }
  ],
  "strengths": ["overall strength 1", "overall strength 2"],
  "weaknesses": ["overall weakness 1", "overall weakness 2"],
  "interviewNotes": "observations about communication and interview behavior"
}`;
}
