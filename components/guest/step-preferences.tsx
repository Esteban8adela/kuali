"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  advanceWizardStep,
  saveDraftAndExit,
} from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { RequiredMark } from "@/components/ui/required-mark";
import { resolveParticipantDisplayName } from "@/lib/guest/participant-names";
import {
  ALLERGY_OPTIONS,
  buildPreferenceState,
  emptyPreferenceState,
  type AllergyOption,
  type ParticipantPreferenceForm,
} from "@/lib/guest/preference-state";
import type { TripParticipant, GuestPreferences } from "@/lib/types/database";

const DIET_STYLES = ["vegan", "vegetarian", "pescatarian", "omnivore", "keto", "other"];

interface ParticipantWithPrefs extends TripParticipant {
  guest_preferences: GuestPreferences | null;
}

interface StepPreferencesProps {
  tripId: string;
  participants: ParticipantWithPrefs[];
  locale: string;
}

function isParticipantComplete(data: ParticipantPreferenceForm): boolean {
  if (data.noRestrictions) return true;
  if (data.allergies.length > 0) return true;
  if (data.dietStyle) return true;
  if (data.additionalComments.trim()) return true;
  return false;
}

export function StepPreferences({
  tripId,
  participants,
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

  function updateParticipant(
    id: string,
    updater: (prev: ParticipantPreferenceForm) => ParticipantPreferenceForm
  ) {
    setByParticipant((prev) => ({
      ...prev,
      [id]: updater(prev[id] ?? emptyPreferenceState()),
    }));
  }

  function toggleNoAllergies(participantId: string) {
    updateParticipant(participantId, (p) => {
      const next = !p.noRestrictions;
      return {
        ...p,
        noRestrictions: next,
        allergies: next ? [] : p.allergies,
        allergiesOther: next ? "" : p.allergiesOther,
      };
    });
  }

  function toggleAllergy(participantId: string, allergy: AllergyOption) {
    updateParticipant(participantId, (p) => ({
      ...p,
      noRestrictions: false,
      allergies: p.allergies.includes(allergy)
        ? p.allergies.filter((a) => a !== allergy)
        : [...p.allergies, allergy],
    }));
  }

  const savePrefsPayloads = useCallback(async () => {
    const payloads = participants.map((p) => {
      const data = byParticipant[p.id] ?? emptyPreferenceState();
      return {
        participantId: p.id,
        noDietaryRestrictions: data.noRestrictions,
        allergies: data.noRestrictions ? [] : data.allergies.filter((a) => a !== "other"),
        allergiesOther: (!data.noRestrictions && data.allergies.includes("other")) ? data.allergiesOther : "",
        dietaryRestrictions: data.dietStyle ? [data.dietStyle] : [],
        proteinPreferences: [],
        generalFoodNotes: data.additionalComments.trim()
          ? [data.additionalComments.trim()]
          : [],
      };
    });
    await saveAllGuestPreferences(payloads);
  }, [participants, byParticipant]);

  function handleContinue() {
    startTransition(async () => {
      await savePrefsPayloads();
      await advanceWizardStep(tripId, 4);
      router.push(`/${locale}/guest/trip/${tripId}/snacks`);
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await savePrefsPayloads();
      await saveDraftAndExit(tripId);
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  const allParticipantsComplete = participants.every((p) =>
    isParticipantComplete(byParticipant[p.id] ?? emptyPreferenceState())
  );

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
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {participants.map((p) => {
              const data = byParticipant[p.id] ?? emptyPreferenceState();
              const hasAllergies = data.allergies.length > 0;
              const isComplete = isParticipantComplete(data);
              const guestNumber =
                p.participant_type === "child"
                  ? participants.filter((x) => x.participant_type === "child").indexOf(p) + 1
                  : participants.filter((x) => x.participant_type === "adult").indexOf(p) + 1;
              const displayName = resolveParticipantDisplayName(
                p.display_name,
                p.participant_type,
                guestNumber,
                locale
              );

              return (
                <Card
                  key={p.id}
                  className={`flex h-full min-h-[320px] flex-col border bg-white shadow-sm ${
                    isComplete ? "border-[#C4A052]/25" : "border-amber-300"
                  }`}
                >
                  <CardHeader className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 pb-3">
                    <CardTitle className="font-display text-xl text-[#1B3A4B]">
                      {displayName}
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
                        {t("allergies")} <RequiredMark />
                      </Label>

                      <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md bg-green-50 px-2 py-1.5 text-xs font-medium text-green-700">
                        <Checkbox
                          checked={data.noRestrictions}
                          onCheckedChange={() => toggleNoAllergies(p.id)}
                        />
                        <span>{t("noAllergies")}</span>
                      </label>

                      <div className={`mt-2 grid grid-cols-2 gap-2 ${data.noRestrictions ? "pointer-events-none opacity-40" : ""}`}>
                        {ALLERGY_OPTIONS.map((key) => (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Checkbox
                              checked={data.allergies.includes(key)}
                              onCheckedChange={() => toggleAllergy(p.id, key)}
                              disabled={data.noRestrictions}
                            />
                            <span>{t(`allergyOptions.${key}`)}</span>
                          </label>
                        ))}
                      </div>
                      {data.allergies.includes("other") && !data.noRestrictions && (
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
                      <Label>{t("dietStyle")}</Label>
                      <Select
                        value={data.dietStyle || undefined}
                        onValueChange={(v) =>
                          updateParticipant(p.id, (prev) => ({ ...prev, dietStyle: v }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t("dietStylePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {DIET_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {t(`dietStyles.${style}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("additionalComments")}</Label>
                      <Textarea
                        className="mt-2 min-h-[70px]"
                        placeholder={t("additionalCommentsPlaceholder")}
                        value={data.additionalComments}
                        onChange={(e) =>
                          updateParticipant(p.id, (prev) => ({
                            ...prev,
                            additionalComments: e.target.value,
                          }))
                        }
                      />
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
        onSaveExit={handleSaveExit}
        continueDisabled={pending || !allParticipantsComplete}
        continueHint={!allParticipantsComplete ? t("validationHint") : undefined}
        continueLoading={pending}
        saveExitLoading={pending}
      />
    </div>
  );
}
