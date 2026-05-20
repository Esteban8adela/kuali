"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCrewCount } from "@/lib/pricing/crew";
import { updateTripDetails, syncTripParticipants } from "@/app/[locale]/(guest)/guest/trip/actions";
import type { Trip } from "@/lib/types/database";

interface StepTripDetailsProps {
  trip: Trip;
  locale: string;
}

export function StepTripDetails({ trip, locale }: StepTripDetailsProps) {
  const t = useTranslations("guest.wizard.details");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adults, setAdults] = useState(trip.adult_count);
  const [children, setChildren] = useState(trip.child_count);
  const [startDate, setStartDate] = useState(trip.start_date ?? "");
  const [endDate, setEndDate] = useState(trip.end_date ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const crewCount = getCrewCount(adults, children);
  const totalGuests = adults + children;

  const persist = useCallback(async () => {
    setSaveStatus("saving");
    try {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        startDate: startDate || null,
        endDate: endDate || null,
        wizardStep: 1,
      });
      await syncTripParticipants(trip.id, adults, children);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [trip.id, adults, children, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void persist();
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [adults, children, startDate, endDate, persist]);

  function handleContinue() {
    startTransition(async () => {
      await updateTripDetails({
        tripId: trip.id,
        adultCount: adults,
        childCount: children,
        startDate: startDate || null,
        endDate: endDate || null,
        wizardStep: 2,
      });
      router.push(`/${locale}/guest/trip/${trip.id}/menu`);
    });
  }

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
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>{t("children")}</Label>
              <span className="font-display text-2xl text-[#1B3A4B]">{children}</span>
            </div>
            <Slider value={[children]} onValueChange={([v]) => setChildren(v)} min={0} max={12} step={1} />
          </div>
        </div>

        <Badge variant="gold" className="w-full justify-center py-2 text-sm">
          {t("crew")}: {crewCount} · {t("totalGuests", { count: totalGuests })}
        </Badge>
        <p className="text-center text-xs text-neutral-500">{t("crewNote")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start">{t("startDate")}</Label>
            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="end">{t("endDate")}</Label>
            <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2" />
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-[#C4A052]/10 bg-[#FAFAF8]/95 px-6 py-4 backdrop-blur md:-mx-0 md:rounded-b-xl">
          <span className="text-xs text-neutral-400">
            {saveStatus === "saving" && tc("saving")}
            {saveStatus === "saved" && tc("saved")}
          </span>
          <Button variant="gold" size="lg" onClick={handleContinue} disabled={pending || totalGuests < 1}>
            {tc("continue")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
