"use client";

import { useState } from "react";
import { Skill, SkillCategory, Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { Plus, Code, Users, FolderOpen } from "lucide-react";

interface Step2Props {
  skills: Skill[];
  selectedSkills: Skill[];
  uiLang: Language;
  onToggleSkill: (skill: Skill) => void;
  onAddCustomSkill: (skill: Skill) => void;
}

const CATEGORY_ORDER: SkillCategory[] = ["technical", "soft", "other"];

const CATEGORY_CONFIG: Record<SkillCategory, { icon: typeof Code; color: string; bg: string }> = {
  technical: { icon: Code, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  soft: { icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  other: { icon: FolderOpen, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
};

const CATEGORY_I18N_KEY: Record<SkillCategory, "setup.step2.technical" | "setup.step2.soft" | "setup.step2.other"> = {
  technical: "setup.step2.technical",
  soft: "setup.step2.soft",
  other: "setup.step2.other",
};

export default function Step2SelectSkills({
  skills,
  selectedSkills,
  uiLang,
  onToggleSkill,
  onAddCustomSkill,
}: Step2Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customCategory, setCustomCategory] = useState<SkillCategory>("technical");

  const isSelected = (skill: Skill) =>
    selectedSkills.some((s) => s.name === skill.name);

  function handleAddCustom() {
    if (!customName.trim()) return;
    onAddCustomSkill({
      name: customName.trim(),
      description: customDesc.trim() || customName.trim(),
      questions: [],
      category: customCategory,
    });
    setCustomName("");
    setCustomDesc("");
    setCustomCategory("technical");
    setShowAddForm(false);
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    skills: skills.filter((s) => (s.category || "technical") === cat),
  })).filter((g) => g.skills.length > 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-muted)]">
        {t("setup.step2.subtitle", uiLang)} ({selectedSkills.length}/5)
      </p>

      {grouped.map(({ category, skills: catSkills }) => {
        const config = CATEGORY_CONFIG[category];
        const Icon = config.icon;

        return (
          <div key={category} className="space-y-3">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${config.bg}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className={`text-sm font-semibold ${config.color}`}>
                {t(CATEGORY_I18N_KEY[category], uiLang)}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({catSkills.length})
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {catSkills.map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => onToggleSkill(skill)}
                  disabled={!isSelected(skill) && selectedSkills.length >= 5}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected(skill)
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-[var(--color-border)] hover:border-indigo-300 disabled:opacity-40"
                  }`}
                >
                  <div className="font-semibold">{skill.name}</div>
                  <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {skill.description}
                  </div>
                  <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {skill.questions.length} questions
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {t("setup.step2.addCustom", uiLang)}
        </button>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Skill name"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value as SkillCategory)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {t(CATEGORY_I18N_KEY[cat], uiLang)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAddCustom}
              disabled={!customName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
