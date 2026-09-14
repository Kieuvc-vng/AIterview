"use client";

import { useState } from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { X, Save } from "lucide-react";

interface SaveJobModalProps {
  uiLang: Language;
  defaultName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function SaveJobModal({
  uiLang,
  defaultName,
  onSave,
  onClose,
}: SaveJobModalProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    onSave(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t("jobs.saveJobTitle", uiLang)}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("jobs.jobName", uiLang)}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("jobs.jobNamePlaceholder", uiLang)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("jobs.cancel", uiLang)}
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "..." : t("jobs.save", uiLang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
