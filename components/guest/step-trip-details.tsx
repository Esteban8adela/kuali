"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { getCrewCount } from "@/lib/pricing/crew";
import { updateTripDetails, saveDraftAndExit } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { RequiredMark } from "@/components/ui/required-mark";
import { isUnsetGuestName } from "@/lib/guest/participant-names";
import { areTripDatesInvalidOrder, areTripDatesValid, formatDateOnlyForPayload, normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import { registerWizardDraftSave } from "@/lib/wizard/draft-registry";
import { MAX_TRIP_GUESTS } from "@/lib/constants/trip";
import type { Trip, TripParticipant } from "@/lib/types/database";

function clampGuestCounts(adultCount: number, childCount: number) {
  let adults = Math.max(0, adultCount);
  let children = Math.max(0, childCount);
  if (adults + children > MAX_TRIP_GUESTS) {
    if (adults > MAX_TRIP_GUESTS) {
      adults = MAX_TRIP_GUESTS;
      children = 0;
    } else {
      children = MAX_TRIP_GUESTS - adults;
    }
  }
  if (adults < 1 && adults + children > 0) {
    adults = 1;
    children = Math.min(children, MAX_TRIP_GUESTS - 1);
  }
  return { adults, children };
}

interface StepTripDetailsProps {
  trip: Trip;
  participants: TripParticipant[];
  locale: string;
}

function initEmptyNames(
  count: number,
  existing: TripParticipant[],
  type: "adult" | "child"
): string[] {
  const fromDb = existing
    .filter((p) => p.participant_type === type)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.display_name);

  return Array.from({ length: count }, (_, i) => {
    const n = fromDb[i];
    return n && !isUnsetGuestName(n) ? n : "";
  });
}

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function StepTripDetails({ trip, participants, locale }: StepTripDetailsProps) {
  const t = useTranslations("guest.wizard.details");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialCounts = clampGuestCounts(trip.adult_count, trip.child_count);
  const [adults, setAdults] = useState(initialCounts.adults);
  const [children, setChildren] = useState(initialCounts.children);
  const [startDate, setStartDate] = useState(() => normalizeDateOnlyInput(trip.start_date) ?? "");
  const [endDate, setEndDate] = useState(() => normalizeDateOnlyInput(trip.end_date) ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [capacityWarning, setCapacityWarning] = useState(false);
  const capacityWarningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [adultNames, setAdultNames] = useState<string[]>(() =>
    initEmptyNames(trip.adult_count, participants, "adult")
  );
  const [childNames, setChildNames] = useState<string[]>(() =>
    initEmptyNames(trip.child_count, participants, "child")
  );

  const minDate = useMemo(() => todayDateString(), []);

  const crewCount = getCrewCount(adults, children);
  const totalGuests = adults + children;
  const hasBothDates = Boolean(startDate && endDate);
  const datesInvalidOrder = areTripDatesInvalidOrder(startDate, endDate);
  const datesValid = hasBothDates && areTripDatesValid(startDate, endDate);
  const adultsValid = adults >= 1;

  useEffect(() => {
    setAdultNames((prev) => {
      const next = [...prev];
      while (next.length < adults) next.push("");
      return next.slice(0, adults);
    });
  }, [adults]);

  useEffect(() => {
    setChildNames((prev) => {
      const next = [...prev];
      while (next.length < children) next.push("");
      return next.slice(0, children);
    });
  }, [children]);

  const canContinue = datesValid && adultsValid && totalGuests >= 1 && totalGuests <= MAX_TRIP_GUESTS;
  const canSaveExit = adultsValid && !datesInvalidOrder && totalGuests <= MAX_TRIP_GUESTS;

  function flashCapacityWarning() {
    setCapacityWarning(true);
    if (capacityWarningTimer.current) clearTimeout(capacityWarningTimer.current);
    capacityWarningTimer.current = setTimeout(() => setCapacityWarning(false), 4000);
  }

  useEffect(() => {
    return () => {
      if (capacityWarningTimer.current) clearTimeout(capacityWarningTimer.current);
    };
  }, []);

  function setAdultsCount(requested: number) {
    const bounded = Math.min(Math.max(1, requested), MAX_TRIP_GUESTS);
    let nextAdults = bounded;
    if (nextAdults + children > MAX_TRIP_GUESTS) {
      nextAdults = Math.max(1, MAX_TRIP_GUESTS - children);
      flashCapacityWarning();
    } else if (bounded !== requested) {
      flashCapacityWarning();
    }
    setAdults(nextAdults);
  }

  function setChildrenCount(requested: number) {
    const bounded = Math.min(Math.max(0, requested), MAX_TRIP_GUESTS);
    let nextChildren = bounded;
    if (adults + nextChildren > MAX_TRIP_GUESTS) {
      nextChildren = Math.max(0, MAX_TRIP_GUESTS - adults);
      flashCapacityWarning();
    } else if (bounded !== requested) {
      flashCapacityWarning();
    }
    setChildren(nextChildren);
  }

  function tripDatePayload() {
    return {
      startDate: formatDateOnlyForPayload(startDate),
      endDate: formatDateOnlyForPayload(endDate),
    };
  }

  const persist = useCallback(async () => {
    if (!adultsValid || datesInvalidOrder) return;
    setSaveStatus("saving");
    try {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        ...tripDatePayload(),
        wizardStep: 1,
        adultNames: adultNames.map((n) => n.trim()),
        childNames: childNames.map((n) => n.trim()),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [trip.id, adults, children, startDate, endDate, adultNames, childNames, adultsValid, datesInvalidOrder]);

  useEffect(() => {
    if (!adultsValid || datesInvalidOrder) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        void persist();
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [adults, children, startDate, endDate, adultNames, childNames, persist, adultsValid, datesInvalidOrder]);

  useEffect(() => {
    if (!adultsValid || datesInvalidOrder) return;
    return registerWizardDraftSave(persist);
  }, [persist, adultsValid, datesInvalidOrder]);

  function handleContinue() {
    if (!canContinue) return;
    startTransition(async () => {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        ...tripDatePayload(),
        wizardStep: 2,
        adultNames: adultNames.map((n) => n.trim()),
        childNames: childNames.map((n) => n.trim()),
      });
      router.push(`/${locale}/guest/trip/${trip.id}/menu`);
    });
  }

  function handleSaveExit() {
    if (!adultsValid || datesInvalidOrder) return;
    startTransition(async () => {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        ...tripDatePayload(),
        wizardStep: 1,
        adultNames: adultNames.map((n) => n.trim()),
        childNames: childNames.map((n) => n.trim()),
      });
      await saveDraftAndExit(trip.id);
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  const statusText =
    saveStatus === "saving" ? tc("saving") : saveStatus === "saved" ? tc("saved") : undefined;

  return (
    <Card className="glass-card mx-auto max-w-2xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>
                {t("adults")} <RequiredMark />
              </Label>
              <span className="font-display text-2xl text-[#1B3A4B]">{adults}</span>
            </div>
            <Slider
              value={[adults]}
              onValueChange={([v]) => setAdultsCount(v)}
              min={1}
              max={MAX_TRIP_GUESTS}
              step={1}
            />
            {!adultsValid && (
              <p className="mt-2 text-sm text-amber-800">{t("adultsRequired")}</p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>{t("children")}</Label>
              <span className="font-display text-2xl text-[#1B3A4B]">{children}</span>
            </div>
            <Slider
              value={[children]}
              onValueChange={([v]) => setChildrenCount(v)}
              min={0}
              max={MAX_TRIP_GUESTS}
              step={1}
            />
          </div>

          {capacityWarning && (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950 transition-opacity"
              role="status"
            >
              {t("maxCapacity", { max: MAX_TRIP_GUESTS })}
            </p>
          )}
        </div>

        {adults > 0 && (
          <div className="space-y-3 rounded-xl border border-[#C4A052]/20 bg-white/50 p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">
              {t("adultNames")} <RequiredMark />
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {adultNames.map((_, i) => (
                <div key={`adult-${i}`}>
                  <Label className="text-sm text-neutral-800">
                    {t("adultLabel", { number: i + 1 })}
                  </Label>
                  <Input
                    className="mt-1"
                    value={adultNames[i]}
                    onChange={(e) => {
                      const next = [...adultNames];
                      next[i] = e.target.value;
                      setAdultNames(next);
                    }}
                    placeholder={t("guestNamePlaceholder", { number: i + 1 })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {children > 0 && (
          <div className="space-y-3 rounded-xl border border-[#C4A052]/20 bg-white/50 p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">
              {t("childNames")} <RequiredMark />
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {childNames.map((_, i) => (
                <div key={`child-${i}`}>
                  <Label className="text-sm text-neutral-800">
                    {t("childLabel", { number: i + 1 })}
                  </Label>
                  <Input
                    className="mt-1"
                    value={childNames[i]}
                    onChange={(e) => {
                      const next = [...childNames];
                      next[i] = e.target.value;
                      setChildNames(next);
                    }}
                    placeholder={t("childNamePlaceholder", { number: i + 1 })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-center">
          <Badge variant="gold" className="px-4 py-2.5 text-base font-medium">
            {t("crewCateringIncluded")}
          </Badge>
          <InfoTooltip
            label={t("crewInfoLabel")}
            content={t("crewInfoTooltip", { crew: crewCount })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start">
              {t("startDate")} <RequiredMark />
            </Label>
            <Input
              id="start"
              type="date"
              min={minDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="end">
              {t("endDate")} <RequiredMark />
            </Label>
            <Input
              id="end"
              type="date"
              min={startDate && startDate >= minDate ? startDate : minDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        {!datesValid && (
          <p className="text-center text-sm text-amber-800">
            {datesInvalidOrder ? t("datesInvalidOrder") : t("datesRequired")}
          </p>
        )}

        <WizardNav
          onContinue={handleContinue}
          onSaveExit={canSaveExit ? handleSaveExit : undefined}
          continueDisabled={pending || !canContinue}
          continueLoading={pending}
          saveExitLoading={pending}
          statusText={statusText}
        />
      </CardContent>
    </Card>
  );
}
