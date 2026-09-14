"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Language, Skill, InterviewConfig, AnalyzeJDResponse } from "@/lib/types";
import { encodeConfig } from "@/lib/config";
import { t } from "@/lib/i18n";
import StepIndicator from "@/components/setup/StepIndicator";
import Step1InputJD from "@/components/setup/Step1InputJD";
import Step2SelectSkills from "@/components/setup/Step2SelectSkills";
import Step3EditQuestions from "@/components/setup/Step3EditQuestions";
import Step4GenerateLink from "@/components/setup/Step4GenerateLink";
import SaveJobModal from "@/components/setup/SaveJobModal";

export default function SetupPage() {
  const uiLang: Language = "vi";
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [jd, setJD] = useState("");
  const [lang, setLang] = useState<Language>("vi");
  const [jobTitle, setJobTitle] = useState("");
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewUrl, setInterviewUrl] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const stepLabels = [
    t("setup.step1.title", uiLang),
    t("setup.step2.title", uiLang),
    t("setup.step3.title", uiLang),
    t("setup.step4.title", uiLang),
  ];

  async function handleAnalyze() {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, lang }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("error.apiError", uiLang));
        return;
      }

      const data: AnalyzeJDResponse = await res.json();
      setJobTitle(data.jobTitle);
      setAllSkills(data.skills);
      setSelectedSkills([]);
      setStep(2);
    } catch {
      toast.error(t("error.apiError", uiLang));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleToggleSkill(skill: Skill) {
    setSelectedSkills((prev) => {
      const exists = prev.some((s) => s.name === skill.name);
      if (exists) return prev.filter((s) => s.name !== skill.name);
      if (prev.length >= 5) return prev;
      return [...prev, { ...skill }];
    });
  }

  function handleAddCustomSkill(skill: Skill) {
    setAllSkills((prev) => [...prev, skill]);
    if (selectedSkills.length < 5) {
      setSelectedSkills((prev) => [...prev, skill]);
    }
  }

  function handleUpdateQuestion(skillIndex: number, questionIndex: number, value: string) {
    setSelectedSkills((prev) =>
      prev.map((skill, si) =>
        si === skillIndex
          ? {
              ...skill,
              questions: skill.questions.map((q, qi) =>
                qi === questionIndex ? value : q
              ),
            }
          : skill
      )
    );
  }

  function handleDeleteQuestion(skillIndex: number, questionIndex: number) {
    setSelectedSkills((prev) =>
      prev.map((skill, si) =>
        si === skillIndex
          ? { ...skill, questions: skill.questions.filter((_, qi) => qi !== questionIndex) }
          : skill
      )
    );
  }

  function handleAddQuestion(skillIndex: number) {
    setSelectedSkills((prev) =>
      prev.map((skill, si) =>
        si === skillIndex
          ? { ...skill, questions: [...skill.questions, ""] }
          : skill
      )
    );
  }

  function handleMoveQuestion(
    skillIndex: number,
    questionIndex: number,
    direction: "up" | "down"
  ) {
    setSelectedSkills((prev) =>
      prev.map((skill, si) => {
        if (si !== skillIndex) return skill;
        const questions = [...skill.questions];
        const targetIndex = direction === "up" ? questionIndex - 1 : questionIndex + 1;
        if (targetIndex < 0 || targetIndex >= questions.length) return skill;
        [questions[questionIndex], questions[targetIndex]] = [
          questions[targetIndex],
          questions[questionIndex],
        ];
        return { ...skill, questions };
      })
    );
  }

  async function handleSaveJob(name: string) {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          jobTitle,
          lang,
          skills: selectedSkills,
        }),
      });
      if (!res.ok) {
        toast.error(t("error.apiError", uiLang));
        setShowSaveModal(false);
        return;
      }
      toast.success(t("jobs.saved", uiLang));
      setShowSaveModal(false);
      router.push("/jobs");
    } catch {
      toast.error(t("error.apiError", uiLang));
      setShowSaveModal(false);
    }
  }

  function handleGenerateLink() {
    const config: InterviewConfig = {
      lang,
      jobTitle,
      skills: selectedSkills,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const encoded = encodeConfig(config);
    const url = `${window.location.origin}/interview?config=${encoded}`;
    setInterviewUrl(url);
  }

  const canGoNext =
    (step === 2 && selectedSkills.length >= 1) ||
    (step === 3 &&
      selectedSkills.every((s) => s.questions.length > 0 && s.questions.every((q) => q.trim())));

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-center mb-2">
          {t("setup.title", uiLang)}
        </h1>

        <StepIndicator currentStep={step} steps={stepLabels} />

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{stepLabels[step - 1]}</h2>

          {step === 1 && (
            <Step1InputJD
              jd={jd}
              lang={lang}
              uiLang={uiLang}
              isAnalyzing={isAnalyzing}
              onJDChange={setJD}
              onLangChange={setLang}
              onAnalyze={handleAnalyze}
            />
          )}

          {step === 2 && (
            <Step2SelectSkills
              skills={allSkills}
              selectedSkills={selectedSkills}
              uiLang={uiLang}
              onToggleSkill={handleToggleSkill}
              onAddCustomSkill={handleAddCustomSkill}
            />
          )}

          {step === 3 && (
            <Step3EditQuestions
              skills={selectedSkills}
              uiLang={uiLang}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onAddQuestion={handleAddQuestion}
              onMoveQuestion={handleMoveQuestion}
            />
          )}

          {step === 4 && (
            <Step4GenerateLink
              jobTitle={jobTitle}
              skills={selectedSkills}
              lang={lang}
              uiLang={uiLang}
              interviewUrl={interviewUrl}
              onGenerate={handleGenerateLink}
              onSaveJob={() => setShowSaveModal(true)}
            />
          )}

          {step >= 2 && step <= 3 && (
            <div className="flex justify-between mt-8 pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("setup.back", uiLang)}
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canGoNext}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t("setup.next", uiLang)}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 4 && !interviewUrl && (
            <div className="flex justify-start mt-8 pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("setup.back", uiLang)}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSaveModal && (
        <SaveJobModal
          uiLang={uiLang}
          defaultName={jobTitle}
          onSave={handleSaveJob}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
