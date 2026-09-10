"use client";

import { Skill, Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";

interface Step3Props {
  skills: Skill[];
  uiLang: Language;
  onUpdateQuestion: (skillIndex: number, questionIndex: number, value: string) => void;
  onDeleteQuestion: (skillIndex: number, questionIndex: number) => void;
  onAddQuestion: (skillIndex: number) => void;
  onMoveQuestion: (skillIndex: number, questionIndex: number, direction: "up" | "down") => void;
}

export default function Step3EditQuestions({
  skills,
  uiLang,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onMoveQuestion,
}: Step3Props) {
  return (
    <div className="space-y-8">
      {skills.map((skill, skillIdx) => (
        <div
          key={skill.name}
          className="rounded-xl border border-[var(--color-border)] overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-3 border-b border-[var(--color-border)]">
            <h3 className="font-semibold">{skill.name}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{skill.description}</p>
          </div>

          <div className="p-4 space-y-3">
            {skill.questions.map((question, qIdx) => (
              <div key={qIdx} className="flex items-start gap-2">
                <span className="mt-2.5 text-xs font-medium text-[var(--color-text-muted)] w-6 shrink-0">
                  {qIdx + 1}.
                </span>
                <textarea
                  value={question}
                  onChange={(e) => onUpdateQuestion(skillIdx, qIdx, e.target.value)}
                  rows={2}
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-y"
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onMoveQuestion(skillIdx, qIdx, "up")}
                    disabled={qIdx === 0}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onMoveQuestion(skillIdx, qIdx, "down")}
                    disabled={qIdx === skill.questions.length - 1}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteQuestion(skillIdx, qIdx)}
                    className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    title={t("setup.step3.deleteQuestion", uiLang)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => onAddQuestion(skillIdx)}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
            >
              <Plus className="h-4 w-4" />
              {t("setup.step3.addQuestion", uiLang)}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
