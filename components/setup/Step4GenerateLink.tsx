"use client";

import { useState } from "react";
import { Skill, Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Copy, Check, Link as LinkIcon, Save } from "lucide-react";

interface Step4Props {
  jobTitle: string;
  skills: Skill[];
  lang: Language;
  uiLang: Language;
  interviewUrl: string | null;
  onGenerate: () => void;
  onSaveJob: () => void;
}

export default function Step4GenerateLink({
  jobTitle,
  skills,
  lang,
  uiLang,
  interviewUrl,
  onGenerate,
  onSaveJob,
}: Step4Props) {
  const [copied, setCopied] = useState(false);

  const totalQuestions = skills.reduce((sum, s) => sum + s.questions.length, 0);

  async function handleCopy() {
    if (!interviewUrl) return;
    await navigator.clipboard.writeText(interviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border)] p-6 space-y-4">
        <h3 className="font-semibold text-lg">{t("setup.step4.summary", uiLang)}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{skills.length}</div>
            <div className="text-sm text-[var(--color-text-muted)]">
              {t("setup.step4.skillCount", uiLang)}
            </div>
          </div>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
            <div className="text-sm text-[var(--color-text-muted)]">
              {t("setup.step4.questionCount", uiLang)}
            </div>
          </div>
          <div className="rounded-lg bg-pink-50 dark:bg-pink-950/30 p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">
              {lang === "vi" ? "VN" : "EN"}
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">
              {t("setup.step4.language", uiLang)}
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">{t("interview.position", uiLang)}</div>
          <div className="text-[var(--color-text-muted)]">{jobTitle}</div>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Skills</div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s.name}
                className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300"
              >
                {s.name} ({s.questions.length}Q)
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {!interviewUrl && (
          <button
            onClick={onGenerate}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-lg font-semibold text-white hover:shadow-lg transition-all"
          >
            <LinkIcon className="inline h-5 w-5 mr-2" />
            {t("setup.step4.generate", uiLang)}
          </button>
        )}
        <button
          onClick={onSaveJob}
          className="flex-1 rounded-xl border-2 border-indigo-600 px-6 py-4 text-lg font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
        >
          <Save className="inline h-5 w-5 mr-2" />
          {t("jobs.saveJob", uiLang)}
        </button>
      </div>

      {interviewUrl && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-950/20 p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
            <Check className="h-5 w-5" />
            Link created!
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={interviewUrl}
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t("setup.step4.copied", uiLang)}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t("setup.step4.copyLink", uiLang)}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
