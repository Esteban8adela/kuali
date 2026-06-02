"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { StepStatus } from "@/lib/trip/step-status";

const STEPS = ["details", "menu", "preferences", "snacks", "bar"] as const;
const STEP_PATHS = ["details", "menu", "preferences", "snacks", "bar"] as const;

interface WizardProgressProps {
  currentStep: number;
  tripId: string;
  locale: string;
  stepStatus: StepStatus;
}

export function WizardProgress({
  currentStep,
  tripId,
  locale,
  stepStatus,
}: WizardProgressProps) {
  const t = useTranslations("guest.wizard.steps");
  const states = [
    stepStatus.step1,
    stepStatus.step2,
    stepStatus.step3,
    stepStatus.step4,
    stepStatus.step5,
  ];
  const completedCount = states.filter((s) => s === "complete").length;
  const progress = (completedCount / STEPS.length) * 100;

  return (
    <div className="sticky top-0 z-20 border-b border-[#C4A052]/15 bg-[#FAFAF8]/95 px-4 py-4 backdrop-blur-md md:px-8">
      <Progress value={progress} className="mb-4 h-0.5" />
      <ol className="flex justify-between gap-2">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const active = stepNum === currentStep;
          const state = states[i];
          const done = state === "complete";
          const partial = state === "partial";
          const href = `/${locale}/guest/trip/${tripId}/${STEP_PATHS[i]}`;

          return (
            <li key={step} className="flex-1 text-center">
              <Link
                href={href}
                className={cn(
                  "group inline-flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider transition hover:opacity-80 md:text-xs",
                  active && "font-medium text-[#C4A052]",
                  done && !active && "text-[#1B3A4B]",
                  partial && !active && "text-amber-700",
                  !active && !done && !partial && "text-neutral-400"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition group-hover:scale-110",
                    active && "border-[#C4A052] bg-[#C4A052] text-[#0A0A0A]",
                    done && !active && "border-[#1B3A4B] bg-[#1B3A4B] text-white",
                    partial && !active && "border-amber-400 bg-amber-50 text-amber-800",
                    !active && !done && !partial && "border-neutral-300"
                  )}
                >
                  {done ? "✓" : stepNum}
                </span>
                <span className="hidden sm:inline">{t(step)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
