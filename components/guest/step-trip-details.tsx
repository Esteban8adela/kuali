"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getCrewCount } from "@/lib/pricing/crew";
import { updateTripDetails } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import type { Trip, TripParticipant } from "@/lib/types/database";

interface StepTripDetailsProps {
  trip: Trip;
  participants: TripParticipant[];
  locale: string;
}

function isGenericName(name: string | undefined, prefix: string) {
  if (!name) return true;
  return new RegExp(`^${prefix} \\d+$`).test(name);
}

function initEmptyNames(
  count: number,
  existing: TripParticipant[],
  type: "adult" | "child",
  prefix: string
): string[] {
  const fromDb = existing
    .filter((p) => p.participant_type === type)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.display_name);

  return Array.from({ length: count }, (_, i) => {
    const n = fromDb[i];
    return n && !isGenericName(n, prefix) ? n : "";
  });
}

export function StepTripDetails({ trip, participants, locale }: StepTripDetailsProps) {
  const t = useTranslations("guest.wizard.details");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adults, setAdults] = useState(trip.adult_count);
  const [children, setChildren] = useState(trip.child_count);
  const [startDate, setStartDate] = useState(trip.start_date ?? "");
  const [endDate, setEndDate] = useState(trip.end_date ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [adultNames, setAdultNames] = useState<string[]>(() =>
    initEmptyNames(trip.adult_count, participants, "adult", "Guest")
  );
  const [childNames, setChildNames] = useState<string[]>(() =>
    initEmptyNames(trip.child_count, participants, "child", "Child")
  );

  const crewCount = getCrewCount(adults, children);
  const totalGuests = adults + children;
  const datesValid = Boolean(startDate && endDate);
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

  const namesValid = useMemo(
    () =>
      adultNames.every((n) => n.trim().length > 0) &&
      childNames.every((n) => n.trim().length > 0),
    [adultNames, childNames]
  );

  const canContinue = datesValid && adultsValid && namesValid && totalGuests >= 1;

  const persist = useCallback(async () => {
    if (!datesValid || !adultsValid) return;
    setSaveStatus("saving");
    try {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        startDate: startDate || null,
        endDate: endDate || null,
        wizardStep: 1,
        adultNames: adultNames.map((n) => n.trim()),
        childNames: childNames.map((n) => n.trim()),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [trip.id, adults, children, startDate, endDate, adultNames, childNames, datesValid, adultsValid]);

  useEffect(() => {
    if (!datesValid || !adultsValid) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        void persist();
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [adults, children, startDate, endDate, adultNames, childNames, persist, datesValid, adultsValid]);

  function handleContinue() {
    startTransition(async () => {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        startDate: startDate || null,
        endDate: endDate || null,
        wizardStep: 2,
        adultNames: adultNames.map((n) => n.trim()),
        childNames: childNames.map((n) => n.trim()),
      });
      router.push(`/${locale}/guest/trip/${trip.id}/menu`);
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
              <Label>{t("adults")}</Label>
              <span className="font-display text-2xl text-[#1B3A4B]">{adults}</span>
            </div>
            <Slider value={[adults]} onValueChange={([v]) => setAdults(v)} min={0} max={20} step={1} />
            {!adultsValid && (
              <p className="mt-2 text-sm text-amber-800">{t("adultsRequired")}</p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>{t("children")}</Label>
              <span className="font-display text-2xl text-[#1B3A4B]">{children}</span>
            </div>
            <Slider value={[children]} onValueChange={([v]) => setChildren(v)} min={0} max={12} step={1} />
          </div>
        </div>

        {adults > 0 && (
          <div className="space-y-3 rounded-xl border border-[#C4A052]/20 bg-white/50 p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">{t("adultNames")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {adultNames.map((_, i) => (
                <div key={`adult-${i}`}>
                  <Label className="text-xs text-neutral-500">
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
                    placeholder={t("namePlaceholder")}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {children > 0 && (
          <div className="space-y-3 rounded-xl border border-[#C4A052]/20 bg-white/50 p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">{t("childNames")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {childNames.map((_, i) => (
                <div key={`child-${i}`}>
                  <Label className="text-xs text-neutral-500">
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
                    placeholder={t("namePlaceholder")}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Badge variant="gold" className="w-full justify-center py-2 text-sm">
          {t("crew")}: {crewCount} · {t("totalGuests", { count: totalGuests })}
        </Badge>
        <p className="text-center text-xs text-neutral-500">{t("crewNote")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start">{t("startDate")}</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="end">{t("endDate")}</Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        {!datesValid && (
          <p className="text-center text-sm text-amber-800">{t("datesRequired")}</p>
        )}

        <WizardNav
          onContinue={handleContinue}
          continueDisabled={pending || !canContinue}
          continueLoading={pending}
          statusText={statusText}
        />
      </CardContent>
    </Card>
  );
}
