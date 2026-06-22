"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface WizardNavProps {
  backHref?: string;
  onContinue?: () => void;
  onSaveExit?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  saveExitLoading?: boolean;
  statusText?: string;
  continueHint?: string;
}

export function WizardNav({
  backHref,
  onContinue,
  onSaveExit,
  continueLabel,
  continueDisabled,
  continueLoading,
  saveExitLoading,
  statusText,
  continueHint,
}: WizardNavProps) {
  const tc = useTranslations("common");

  return (
    <div className="sticky bottom-0 -mx-6 mt-8 flex items-center justify-between gap-4 border-t border-[#C4A052]/10 bg-[#FAFAF8]/95 px-6 py-4 backdrop-blur md:-mx-0 md:rounded-b-xl">
      <div className="flex min-w-0 items-center gap-2">
        {backHref && (
          <Button variant="outline" size="lg" asChild>
            <Link href={backHref}>{tc("back")}</Link>
          </Button>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {continueHint && continueDisabled && (
          <p className="max-w-xs text-right text-sm text-red-700">{continueHint}</p>
        )}
        <div className="flex items-center gap-3">
          {statusText && (
            <span className="hidden text-sm text-neutral-800 sm:inline">{statusText}</span>
          )}
          {onSaveExit && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onSaveExit}
              disabled={saveExitLoading}
              className="text-neutral-500"
            >
              {saveExitLoading ? tc("saving") : tc("saveExit")}
            </Button>
          )}
          {onContinue && (
            <Button
              variant="gold"
              size="lg"
              onClick={onContinue}
              disabled={continueDisabled || continueLoading}
            >
              {continueLoading ? tc("saving") : (continueLabel ?? tc("continue"))}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
