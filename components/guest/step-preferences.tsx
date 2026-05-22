"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveAllGuestPreferences,
  saveGlobalMealSchedule,
  advanceWizardStep,
} from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import {
  ALLERGY_OPTIONS,
  buildPreferenceState,
  emptyPreferenceState,
  type AllergyOption,
  type ParticipantPreferenceForm,
} from "@/lib/guest/preference-state";
import type { GlobalMealSchedule } from "@/lib/catalog/types";
import type { TripParticipant, GuestPreferences } from "@/lib/types/database";

const PROTEINS = ["white_fish", "tuna", "seafood", "beef", "poultry", "pork"];
const MEALS = ["breakfast", "lunch", "dinner"] as const;
const HEAVINESS = ["light", "moderate", "heavy"] as const;

interface ParticipantWithPrefs extends TripParticipant {
  guest_preferences: GuestPreferences | null;
}

interface StepPreferencesProps {
  tripId: string;
  participants: ParticipantWithPrefs[];
  initialGlobalSchedule?: GlobalMealSchedule;
  locale: string;
}

export function StepPreferences({
  tripId,
  participants,
  initialGlobalSchedule = {},
  locale,
}: StepPreferencesProps) {
  const t = useTranslations("guest.wizard.preferences");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initialState = useMemo(() => {
    const map: Record<string, ParticipantPreferenceForm> = {};
    for (const p of participants) {
      map[p.id] = p.guest_preferences
        ? buildPreferenceState(p.guest_preferences)
        : emptyPreferenceState();
    }
    return map;
  }, [participants]);

  const [byParticipant, setByParticipant] =
    useState<Record<string, ParticipantPreferenceForm>>(initialState);

  const [globalMealSchedule, setGlobalMealSchedule] = useState<GlobalMealSchedule>(
    initialGlobalSchedule ?? {}
  );

  function updateParticipant(
    id: string,
    updater: (prev: ParticipantPreferenceForm) => ParticipantPreferenceForm
  ) {
    setByParticipant((prev) => ({
      ...prev,
      [id]: updater(prev[id] ?? emptyPreferenceState()),
    }));
  }

  function toggleAllergy(participantId: string, allergy: AllergyOption) {
    updateParticipant(participantId, (p) => ({
      ...p,
      allergies: p.allergies.includes(allergy)
        ? p.allergies.filter((a) => a !== allergy)
        : [...p.allergies, allergy],
    }));
  }

  function toggleProtein(participantId: string, protein: string) {
    updateParticipant(participantId, (p) => ({
      ...p,
      proteinPreferences: p.proteinPreferences.includes(protein)
        ? p.proteinPreferences.filter((x) => x !== protein)
        : [...p.proteinPreferences, protein],
    }));
  }

  function handleContinue() {
    startTransition(async () => {
      const payloads = participants.map((p) => {
        const data = byParticipant[p.id] ?? emptyPreferenceState();
        return {
          participantId: p.id,
          allergies: data.allergies.filter((a) => a !== "other"),
          allergiesOther: data.allergies.includes("other") ? data.allergiesOther : "",
          dietaryRestrictions: [],
          proteinPreferences: data.proteinPreferences,
        };
      });
      await saveAllGuestPreferences(payloads);
      await saveGlobalMealSchedule({ tripId, mealSchedule: globalMealSchedule });
      await advanceWizardStep(tripId, 4);
      router.push(`/${locale}/guest/trip/${tripId}/bar`);
    });
  }

  if (!participants.length) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-12 text-center text-neutral-500">
          {t("noParticipants")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("globalMealsTitle")}</CardTitle>
          <CardDescription>{t("globalMealsHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 rounded-xl border border-[#1B3A4B]/15 bg-[#1B3A4B]/5 p-4 md:grid-cols-3">
            {MEALS.map((meal) => (
              <div key={meal} className="space-y-2">
                <Label className="font-medium text-[#1B3A4B]">{t(meal)}</Label>
                <Input
                  type="time"
                  value={globalMealSchedule[meal]?.time ?? ""}
                  onChange={(e) =>
                    setGlobalMealSchedule((s) => ({
                      ...s,
                      [meal]: { ...s[meal], time: e.target.value },
                    }))
                  }
                />
                <div>
                  <Label className="text-xs text-neutral-500">{t("abundance")}</Label>
                  <Select
                    value={globalMealSchedule[meal]?.heaviness ?? ""}
                    onValueChange={(v) =>
                      setGlobalMealSchedule((s) => ({
                        ...s,
                        [meal]: { ...s[meal], heaviness: v },
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("abundancePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {HEAVINESS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {t(`heaviness.${h}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {participants.map((p) => {
              const data = byParticipant[p.id] ?? emptyPreferenceState();
              const hasAllergies = data.allergies.length > 0;

              return (
                <Card
                  key={p.id}
                  className="flex h-full min-h-[320px] flex-col border border-[#C4A052]/25 bg-white shadow-sm"
                >
                  <CardHeader className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 pb-3">
                    <CardTitle className="font-display text-xl text-[#1B3A4B]">
                      {p.display_name}
                    </CardTitle>
                    <CardDescription className="capitalize text-neutral-500">
                      {p.participant_type === "child" ? t("childGuest") : t("adultGuest")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                    <div
                      className={
                        hasAllergies
                          ? "rounded-lg border border-red-200 bg-red-50/80 p-3"
                          : "rounded-lg border border-neutral-200 p-3"
                      }
                    >
                      <Label className={hasAllergies ? "text-red-700" : "text-[#1B3A4B]"}>
                        {t("allergies")}
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {ALLERGY_OPTIONS.map((key) => (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Checkbox
                              checked={data.allergies.includes(key)}
                              onCheckedChange={() => toggleAllergy(p.id, key)}
                            />
                            <span>{t(`allergyOptions.${key}`)}</span>
                          </label>
                        ))}
                      </div>
                      {data.allergies.includes("other") && (
                        <Textarea
                          className="mt-2 min-h-[60px] text-sm"
                          placeholder={t("allergiesOtherPlaceholder")}
                          value={data.allergiesOther}
                          onChange={(e) =>
                            updateParticipant(p.id, (prev) => ({
                              ...prev,
                              allergiesOther: e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>

                    <div>
                      <Label>{t("proteins")}</Label>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {PROTEINS.map((protein) => (
                          <Button
                            key={protein}
                            type="button"
                            size="sm"
                            variant={
                              data.proteinPreferences.includes(protein) ? "gold" : "outline"
                            }
                            className="h-7 text-xs"
                            onClick={() => toggleProtein(p.id, protein)}
                          >
                            {t(`proteinOptions.${protein}`)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <WizardNav
        backHref={`/${locale}/guest/trip/${tripId}/menu`}
        onContinue={handleContinue}
        continueDisabled={pending}
        continueLoading={pending}
      />
    </div>
  );
}
