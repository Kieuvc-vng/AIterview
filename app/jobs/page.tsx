"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  UserPlus,
  Copy,
  Check,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { SavedJob, CandidateLink, Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface CandidateWithUrl extends CandidateLink {
  url?: string;
}

export default function JobsPage() {
  const uiLang: Language = "vi";

  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Record<string, CandidateWithUrl[]>>({});
  const [candidateName, setCandidateName] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      toast.error(t("error.apiError", uiLang));
    } finally {
      setLoading(false);
    }
  }

  async function handleExpandJob(jobId: string) {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      setNewLinkUrl(null);
      setCandidateName("");
      return;
    }
    setExpandedJobId(jobId);
    setNewLinkUrl(null);
    setCandidateName("");

    if (!candidates[jobId]) {
      try {
        const res = await fetch(`/api/jobs/${jobId}/candidates`);
        const data = await res.json();
        setCandidates((prev) => ({ ...prev, [jobId]: data.candidates || [] }));
      } catch {
        setCandidates((prev) => ({ ...prev, [jobId]: [] }));
      }
    }
  }

  async function handleCreateLink(jobId: string) {
    if (!candidateName.trim() || creatingLink) return;
    setCreatingLink(true);
    setNewLinkUrl(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName: candidateName.trim() }),
      });

      if (!res.ok) {
        toast.error(t("error.apiError", uiLang));
        return;
      }

      const data = await res.json();
      setNewLinkUrl(data.url);
      setCandidates((prev) => ({
        ...prev,
        [jobId]: [...(prev[jobId] || []), { ...data.candidate, url: data.url }],
      }));
      setCandidateName("");
      toast.success(t("jobs.linkCreated", uiLang));
    } catch {
      toast.error(t("error.apiError", uiLang));
    } finally {
      setCreatingLink(false);
    }
  }

  async function handleDeleteJob(jobId: string) {
    if (!confirm(t("jobs.deleteConfirm", uiLang))) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("error.apiError", uiLang));
        return;
      }
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (expandedJobId === jobId) {
        setExpandedJobId(null);
      }
      setCandidates((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      toast.success(t("jobs.deleted", uiLang));
    } catch {
      toast.error(t("error.apiError", uiLang));
    }
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("jobs.title", uiLang)}</h1>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t("jobs.createNew", uiLang)}
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Briefcase className="mx-auto h-12 w-12 text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-muted)]">{t("jobs.empty", uiLang)}</p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t("jobs.createNew", uiLang)}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const jobCandidates = candidates[job.id] || [];
              const totalQ = job.skills.reduce((s, sk) => s + sk.questions.length, 0);

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => handleExpandJob(job.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg truncate">{job.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)] mt-1">
                        {job.jobTitle} &middot; {job.skills.length} {t("jobs.skills", uiLang)} &middot; {totalQ} {t("jobs.questions", uiLang)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="flex flex-wrap gap-1 hidden sm:flex">
                        {job.skills.slice(0, 3).map((s) => (
                          <span
                            key={s.name}
                            className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                          >
                            {s.name}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            +{job.skills.length - 3}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job.id);
                        }}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title={t("jobs.deleteJob", uiLang)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-[var(--color-text-muted)]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[var(--color-text-muted)]" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--color-border)] px-6 py-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-sm">{t("jobs.addCandidate", uiLang)}</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder={t("jobs.candidatePlaceholder", uiLang)}
                          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateLink(job.id);
                          }}
                        />
                        <button
                          onClick={() => handleCreateLink(job.id)}
                          disabled={!candidateName.trim() || creatingLink}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {t("jobs.createLink", uiLang)}
                        </button>
                      </div>

                      {newLinkUrl && (
                        <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-semibold">
                            <Check className="h-4 w-4" />
                            {t("jobs.linkCreated", uiLang)}
                          </div>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              value={newLinkUrl}
                              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-mono truncate"
                            />
                            <button
                              onClick={() => handleCopy(newLinkUrl, "new")}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 shrink-0"
                            >
                              {copiedId === "new" ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  {t("jobs.copied", uiLang)}
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  {t("jobs.copyLink", uiLang)}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {jobCandidates.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="text-sm font-medium text-[var(--color-text-muted)]">
                            {t("jobs.candidates", uiLang)} ({jobCandidates.length})
                          </div>
                          {jobCandidates.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
                            >
                              <div>
                                <div className="text-sm font-medium">{c.candidateName}</div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    c.url || `${window.location.origin}/c/${c.id}`,
                                    c.id
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
                              >
                                {copiedId === c.id ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    {t("jobs.copied", uiLang)}
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    {t("jobs.copyLink", uiLang)}
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
