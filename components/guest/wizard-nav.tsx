"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface WizardNavProps {
  backHref?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  statusText?: string;
}

export function WizardNav({
  backHref,
  onContinue,
  continueLabel,
  continueDisabled,
  continueLoading,
  statusText,
}: WizardNavProps) {
  const tc = useTranslations("common");

  return (
    <div className="sticky bottom-0 -mx-6 mt-8 flex items-center justify-between gap-4 border-t border-[#C4A052]/10 bg-[#FAFAF8]/95 px-6 py-4 backdrop-blur md:-mx-0 md:rounded-b-xl">
      <div className="min-w-0">
        {backHref ? (
          <Button variant="outline" size="lg" asChild>
            <Link href={backHref}>{tc("back")}</Link>
          </Button>
        ) : (
          <span />
        )}
      </div>
      <div className="flex items-center gap-4">
        {statusText && <span className="hidden text-xs text-neutral-400 sm:inline">{statusText}</span>}
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
  );
}
