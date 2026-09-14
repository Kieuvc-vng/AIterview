"use client";

import { useState, useEffect, useRef, use } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, Home } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import {
  InterviewConfig,
  SavedJob,
  CandidateLink,
  ChatMessage,
  ChatEvaluation,
  AttemptResult,
  QuestionResult,
  SkillResult,
  OverallEvaluation,
} from "@/lib/types";
import ChatBubble from "@/components/interview/ChatBubble";
import ProgressBar from "@/components/interview/ProgressBar";
import TypingIndicator from "@/components/interview/TypingIndicator";

export default function CandidateInterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [status, setStatus] = useState<"loading" | "not_found" | "ready">("loading");
  const [job, setJob] = useState<SavedJob | null>(null);
  const [candidate, setCandidate] = useState<CandidateLink | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/candidates/${id}`);
        if (!res.ok) {
          setStatus("not_found");
          return;
        }
        const data = await res.json();
        setJob(data.job);
        setCandidate(data.candidate);
        setStatus("ready");
      } catch {
        setStatus("not_found");
      }
    }
    load();
  }, [id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-[var(--color-text-muted)]">{t("candidate.loading", "vi")}</p>
        </div>
      </div>
    );
  }

  if (status === "not_found" || !job || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">😕</div>
          <h1 className="text-2xl font-bold">{t("candidate.notFound", "vi")}</h1>
          <p className="text-[var(--color-text-muted)]">{t("candidate.notFoundDesc", "vi")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Home className="h-4 w-4" />
            {t("error.backHome", "vi")}
          </Link>
        </div>
      </div>
    );
  }

  const config: InterviewConfig = {
    lang: job.lang,
    jobTitle: job.jobTitle,
    skills: job.skills,
    createdAt: job.createdAt,
  };

  return <CandidateInterview config={config} />;
}

function CandidateInterview({ config }: { config: InterviewConfig }) {
  const lang = config.lang;

  const [phase, setPhase] = useState<"welcome" | "interview" | "evaluating" | "finished">("welcome");
  const [overallEvaluation, setOverallEvaluation] = useState<OverallEvaluation | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { isSkillBanner?: boolean })[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(1);

  const currentAttemptsRef = useRef<AttemptResult[]>([]);
  const currentSkillQuestionsRef = useRef<QuestionResult[]>([]);
  const allResultsRef = useRef<SkillResult[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  function startInterview() {
    setPhase("interview");
    const firstSkill = config.skills[0];
    setMessages([
      { role: "ai", content: `${t("interview.skill", lang)}: ${firstSkill.name}`, isSkillBanner: true },
      { role: "ai", content: firstSkill.questions[0] },
    ]);
  }

  async function handleSend() {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "candidate", content: userMessage }]);
    setIsThinking(true);

    const skill = config.skills[currentSkillIndex];
    const question = skill.questions[currentQuestionIndex];

    const currentMessages: (ChatMessage & { isSkillBanner?: boolean })[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].isSkillBanner) break;
      currentMessages.unshift(messages[i]);
    }

    const conversation = currentMessages.map((m) => ({
      role: m.role === "ai" ? ("interviewer" as const) : ("candidate" as const),
      content: m.content,
    }));
    conversation.push({ role: "candidate", content: userMessage });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          skillName: skill.name,
          originalQuestion: question,
          attemptNumber: currentAttempt,
          lang,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const evaluation: ChatEvaluation = await res.json();

      currentAttemptsRef.current.push({
        answer: userMessage,
        evaluation,
      });

      if (evaluation.evaluation === "sufficient" || currentAttempt >= 3) {
        const questionResult: QuestionResult = {
          question,
          attempts: [...currentAttemptsRef.current],
          finalScore: evaluation.score,
        };
        currentSkillQuestionsRef.current.push(questionResult);
        currentAttemptsRef.current = [];
        moveToNext();
      } else {
        setCurrentAttempt((a) => a + 1);
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: evaluation.followUpQuestion || question },
        ]);
      }
    } catch {
      toast.error(t("error.apiError", lang));
    } finally {
      setIsThinking(false);
    }
  }

  function moveToNext() {
    const skill = config.skills[currentSkillIndex];

    if (currentQuestionIndex < skill.questions.length - 1) {
      const nextQIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQIdx);
      setCurrentAttempt(1);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: skill.questions[nextQIdx] },
      ]);
    } else {
      const avgScore =
        currentSkillQuestionsRef.current.reduce((sum, q) => sum + q.finalScore, 0) /
        currentSkillQuestionsRef.current.length;

      allResultsRef.current.push({
        name: skill.name,
        questions: [...currentSkillQuestionsRef.current],
        averageScore: Math.round(avgScore * 10) / 10,
      });
      currentSkillQuestionsRef.current = [];

      if (currentSkillIndex < config.skills.length - 1) {
        const nextSkillIdx = currentSkillIndex + 1;
        const nextSkill = config.skills[nextSkillIdx];
        setCurrentSkillIndex(nextSkillIdx);
        setCurrentQuestionIndex(0);
        setCurrentAttempt(1);
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `${t("interview.skill", lang)}: ${nextSkill.name}`, isSkillBanner: true },
          { role: "ai", content: nextSkill.questions[0] },
        ]);
      } else {
        finishInterview();
      }
    }
  }

  async function finishInterview() {
    setPhase("evaluating");

    let evaluation: OverallEvaluation | null = null;
    try {
      const res = await fetch("/api/evaluate-overall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          skillResults: allResultsRef.current,
          lang,
        }),
      });

      if (res.ok) {
        evaluation = await res.json();
        setOverallEvaluation(evaluation);
      }
    } catch {
      // non-fatal
    }

    setPhase("finished");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (phase === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold">{t("interview.welcome", lang)}</h1>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="text-sm text-[var(--color-text-muted)]">
              {t("interview.position", lang)}
            </div>
            <div className="text-lg font-semibold">{config.jobTitle}</div>
            <div className="mt-2 text-sm text-[var(--color-text-muted)]">
              {config.skills.length} skills &middot;{" "}
              {config.skills.reduce((s, sk) => s + sk.questions.length, 0)} questions
            </div>
          </div>
          <button
            onClick={startInterview}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-lg font-semibold text-white hover:shadow-lg transition-all"
          >
            {t("interview.start", lang)}
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === "evaluating") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
          <h1 className="text-2xl font-bold">{t("interview.evaluating", lang)}</h1>
          <p className="text-[var(--color-text-muted)]">{t("interview.thinking", lang)}</p>
        </motion.div>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center space-y-6"
        >
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold">{t("interview.complete", lang)}</h1>
          <p className="text-[var(--color-text-muted)]">
            {overallEvaluation
              ? t("interview.reportReady", lang)
              : t("interview.resultsSent", lang)}
          </p>
        </motion.div>
      </div>
    );
  }

  const currentSkill = config.skills[currentSkillIndex];

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="text-sm font-semibold mb-2 text-center">{config.jobTitle}</div>
          <ProgressBar
            currentSkill={currentSkillIndex}
            totalSkills={config.skills.length}
            currentQuestion={currentQuestionIndex}
            totalQuestions={currentSkill.questions.length}
            skillName={currentSkill.name}
            lang={lang}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              content={msg.content}
              isSkillBanner={msg.isSkillBanner}
            />
          ))}
          {isThinking && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="mx-auto flex max-w-2xl gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("interview.placeholder", lang)}
            rows={1}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--background)] px-4 py-3 text-sm resize-none focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
