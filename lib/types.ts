export type Language = "vi" | "en";

export interface Skill {
  name: string;
  description: string;
  questions: string[];
}

export interface InterviewConfig {
  lang: Language;
  jobTitle: string;
  skills: Skill[];
  createdAt: string;
}

export interface AnalyzeJDResponse {
  jobTitle: string;
  skills: Skill[];
}

export interface ChatRequest {
  conversation: Array<{ role: "interviewer" | "candidate"; content: string }>;
  skillName: string;
  originalQuestion: string;
  attemptNumber: number;
  lang: Language;
}

export interface ChatEvaluation {
  evaluation: "sufficient" | "need_followup";
  score: number;
  followUpQuestion?: string;
  notes: string;
}

export interface ChatMessage {
  role: "ai" | "candidate";
  content: string;
}

export interface AttemptResult {
  answer: string;
  evaluation: ChatEvaluation;
}

export interface QuestionResult {
  question: string;
  attempts: AttemptResult[];
  finalScore: number;
}

export interface SkillResult {
  name: string;
  questions: QuestionResult[];
  averageScore: number;
}

export interface InterviewResult {
  config: InterviewConfig;
  skills: SkillResult[];
  completedAt: string;
}
