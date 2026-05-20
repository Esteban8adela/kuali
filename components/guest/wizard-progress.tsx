"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const STEPS = ["details", "menu", "preferences", "bar"] as const;

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const t = useTranslations("guest.wizard.steps");
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="sticky top-0 z-20 border-b border-[#C4A052]/15 bg-[#FAFAF8]/95 px-4 py-4 backdrop-blur-md md:px-8">
      <Progress value={progress} className="mb-4 h-0.5" />
      <ol className="flex justify-between gap-2">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const active = stepNum === currentStep;
          const done = stepNum < currentStep;
          return (
            <li
              key={step}
              className={cn(
                "flex-1 text-center text-[10px] uppercase tracking-wider md:text-xs",
                active && "font-medium text-[#C4A052]",
                done && "text-[#1B3A4B]",
                !active && !done && "text-neutral-400"
              )}
            >
              <span
                className={cn(
                  "mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px]",
                  active && "border-[#C4A052] bg-[#C4A052] text-[#0A0A0A]",
                  done && "border-[#1B3A4B] bg-[#1B3A4B] text-white",
                  !active && !done && "border-neutral-300"
                )}
              >
                {done ? "✓" : stepNum}
              </span>
              <span className="hidden sm:inline">{t(step)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
