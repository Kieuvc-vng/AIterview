"use client";

import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface ProgressBarProps {
  currentSkill: number;
  totalSkills: number;
  currentQuestion: number;
  totalQuestions: number;
  skillName: string;
  lang: Language;
}

export default function ProgressBar({
  currentSkill,
  totalSkills,
  currentQuestion,
  totalQuestions,
  skillName,
  lang,
}: ProgressBarProps) {
  const overallProgress =
    ((currentSkill * totalQuestions + currentQuestion) /
      (totalSkills * totalQuestions)) *
    100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {t("interview.skill", lang)} {currentSkill + 1}/{totalSkills}: {skillName}
        </span>
        <span className="text-[var(--color-text-muted)]">
          {t("interview.question", lang)} {currentQuestion + 1}/{totalQuestions}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${Math.max(overallProgress, 2)}%` }}
        />
      </div>
    </div>
  );
}
