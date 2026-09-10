"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-indigo-600 text-white"
                      : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
              </div>
              <span
                className={`mt-1 text-xs hidden sm:block ${
                  isCurrent ? "font-semibold text-indigo-600" : "text-[var(--color-text-muted)]"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 sm:w-12 ${
                  isCompleted ? "bg-green-500" : "bg-[var(--color-border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
