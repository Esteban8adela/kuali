"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle, Ship, CalendarDays, UtensilsCrossed, Wine, Cookie } from "lucide-react";
import type { StepState, StepStatus } from "@/lib/trip/step-status";

interface TripSummary {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  wizard_step: number;
}

interface GuestDashboardViewProps {
  locale: string;
  trip: TripSummary | null;
  menuName: string | null;
  stepStatus: StepStatus;
}

const STEPS = [
  { key: "dates", icon: CalendarDays, statusKey: "step1" as const, hintKey: "step1Hint" as const },
  { key: "menu", icon: UtensilsCrossed, statusKey: "step2" as const, hintKey: "step2Hint" as const },
  { key: "preferences", icon: Ship, statusKey: "step3" as const, hintKey: "step3Hint" as const },
  { key: "snacks", icon: Cookie, statusKey: "step4" as const, hintKey: "step4Hint" as const },
  { key: "bar", icon: Wine, statusKey: "step5" as const, hintKey: "step5Hint" as const },
  { key: "overview", icon: CheckCircle2, statusKey: "step6" as const, hintKey: "step6Hint" as const },
] as const;

function StepIcon({ state }: { state: StepState }) {
  if (state === "complete") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (state === "partial") return <AlertCircle className="h-5 w-5 text-amber-500" />;
  return <Circle className="h-5 w-5 text-neutral-300" />;
}

function stepBorder(state: StepState) {
  if (state === "complete") return "border-green-200 bg-green-50";
  if (state === "partial") return "border-amber-200 bg-amber-50/50";
  return "border-neutral-200 bg-white";
}

export function GuestDashboardView({ locale, trip, menuName, stepStatus }: GuestDashboardViewProps) {
  const t = useTranslations("guest.dashboard");

  const isSubmitted = trip?.status === "submitted" || trip?.status === "active";
  const allComplete =
    stepStatus.step1 === "complete" &&
    stepStatus.step2 === "complete" &&
    stepStatus.step3 === "complete" &&
    stepStatus.step4 === "complete" &&
    stepStatus.step5 === "complete" &&
    stepStatus.step6 === "complete";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
      <p className="text-lg text-neutral-800">{t("subtitle")}</p>

      {!trip && (
        <Card className="border-2 border-dashed border-[#C4A052]/40">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Ship className="h-12 w-12 text-[#C4A052]" />
            <p className="text-center text-neutral-600">{t("noTrip")}</p>
            <Link
              href={`/${locale}/guest/trip/new`}
              className="inline-flex h-12 items-center rounded-xl bg-[#C4A052] px-8 text-base font-medium text-white transition hover:bg-[#B8943F]"
            >
              {t("newBooking")}
            </Link>
          </CardContent>
        </Card>
      )}

      {trip && (
        <>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">{t("checklist")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STEPS.map(({ key, icon: Icon, statusKey, hintKey }, idx) => {
                const state = stepStatus[statusKey];
                const hint = stepStatus[hintKey];
                const stepNum = idx + 1;
                return (
                  <Link
                    key={key}
                    href={getStepHref(locale, trip.id, stepNum)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${stepBorder(state)}`}
                  >
                    <StepIcon state={state} />
                    <Icon className="h-4 w-4 text-[#1B3A4B]" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[#1B3A4B]">{t(`steps.${key}`)}</span>
                      {hint && <p className="text-xs text-amber-600">{hint}</p>}
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {(isSubmitted || allComplete) && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">{t("orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-green-900">
                <p>
                  <strong>{t("dates")}:</strong> {trip.start_date} → {trip.end_date}
                </p>
                <p>
                  <strong>{t("guests")}:</strong> {trip.adult_count} {t("adults")}
                  {trip.child_count > 0 && `, ${trip.child_count} ${t("children")}`}
                </p>
                {menuName && (
                  <p>
                    <strong>{t("menuLabel")}:</strong> {menuName}
                  </p>
                )}
                <div className="pt-3">
                  <Link
                    href={`/${locale}/guest/trip/${trip.id}/details`}
                    className="inline-flex h-10 items-center rounded-lg border border-green-600 px-4 text-sm font-medium text-green-700 transition hover:bg-green-100"
                  >
                    {t("modify")}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {!isSubmitted && !allComplete && (
            <div className="text-center">
              <Link
                href={getNextStepHref(locale, trip.id, stepStatus)}
                className="inline-flex h-12 items-center rounded-xl bg-[#C4A052] px-8 text-base font-medium text-white transition hover:bg-[#B8943F]"
              >
                {t("continueBooking")}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getStepHref(locale: string, tripId: string, step: number): string {
  const base = `/${locale}/guest/trip/${tripId}`;
  switch (step) {
    case 1: return `${base}/details`;
    case 2: return `${base}/menu`;
    case 3: return `${base}/preferences`;
    case 4: return `${base}/snacks`;
    case 5: return `${base}/bar`;
    case 6: return `${base}/overview`;
    default: return `${base}/details`;
  }
}

function getNextStepHref(locale: string, tripId: string, status: StepStatus): string {
  if (status.step1 !== "complete") return getStepHref(locale, tripId, 1);
  if (status.step2 !== "complete") return getStepHref(locale, tripId, 2);
  if (status.step3 !== "complete") return getStepHref(locale, tripId, 3);
  if (status.step4 !== "complete") return getStepHref(locale, tripId, 4);
  if (status.step5 !== "complete") return getStepHref(locale, tripId, 5);
  return getStepHref(locale, tripId, 6);
}
