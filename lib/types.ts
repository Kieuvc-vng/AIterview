export type Language = "vi" | "en";

export type SkillCategory = "technical" | "soft" | "other";

export interface Skill {
  name: string;
  description: string;
  questions: string[];
  category?: SkillCategory;
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

export interface OverallEvaluationRequest {
  config: InterviewConfig;
  skillResults: SkillResult[];
  lang: Language;
}

export interface SkillEvaluation {
  skill: string;
  score: number;
  level: string;
  strengths: string[];
  weaknesses: string[];
  notes: string;
}

export interface OverallEvaluation {
  overallScore: number;
  recommendation: "Strong Yes" | "Yes" | "Maybe" | "No";
  summary: string;
  skillEvaluations: SkillEvaluation[];
  strengths: string[];
  weaknesses: string[];
  interviewNotes: string;
}

export interface InterviewResultV2 {
  config: InterviewConfig;
  skills: SkillResult[];
  overallEvaluation?: OverallEvaluation;
  completedAt: string;
}

export interface SavedJob {
  id: string;
  name: string;
  jobTitle: string;
  lang: Language;
  skills: Skill[];
  createdAt: string;
}

export interface CandidateLink {
  id: string;
  jobId: string;
  candidateName: string;
  createdAt: string;
}

export interface AppStore {
  jobs: SavedJob[];
  candidates: CandidateLink[];
}
