"use client";

import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

interface Step1Props {
  jd: string;
  lang: Language;
  uiLang: Language;
  isAnalyzing: boolean;
  onJDChange: (jd: string) => void;
  onLangChange: (lang: Language) => void;
  onAnalyze: () => void;
}

export default function Step1InputJD({
  jd,
  lang,
  uiLang,
  isAnalyzing,
  onJDChange,
  onLangChange,
  onAnalyze,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("setup.step1.language", uiLang)}
        </label>
        <select
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Language)}
          className="w-full max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="vi">{t("setup.step1.langVi", uiLang)}</option>
          <option value="en">{t("setup.step1.langEn", uiLang)}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Job Description</label>
        <textarea
          value={jd}
          onChange={(e) => onJDChange(e.target.value)}
          placeholder={t("setup.step1.placeholder", uiLang)}
          rows={12}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={isAnalyzing || jd.trim().length < 50}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("setup.step1.analyzing", uiLang)}
          </>
        ) : (
          t("setup.step1.analyze", uiLang)
        )}
      </button>
    </div>
  );
}
