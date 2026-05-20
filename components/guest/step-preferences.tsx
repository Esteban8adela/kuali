"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveGuestPreferences, advanceWizardStep } from "@/app/[locale]/(guest)/guest/trip/actions";
import type { TripParticipant, GuestPreferences } from "@/lib/types/database";

const PROTEINS = ["white_fish", "tuna", "seafood", "beef", "poultry", "pork"];
const HEAVINESS = ["light", "moderate", "heavy"] as const;

interface ParticipantWithPrefs extends TripParticipant {
  guest_preferences: GuestPreferences | null;
}

interface StepPreferencesProps {
  tripId: string;
  participants: ParticipantWithPrefs[];
  locale: string;
}

export function StepPreferences({ tripId, participants, locale }: StepPreferencesProps) {
  const t = useTranslations("guest.wizard.preferences");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState(participants[0]?.id ?? "");

  const active = participants.find((p) => p.id === activeId) ?? participants[0];
  const prefs = active?.guest_preferences;

  const [allergies, setAllergies] = useState((prefs?.allergies ?? []).join(", "));
  const [proteins, setProteins] = useState<string[]>(prefs?.protein_preferences ?? []);
  const [mealSchedule, setMealSchedule] = useState<Record<string, { time?: string; heaviness?: string }>>(
    (prefs?.meal_schedule as Record<string, { time?: string; heaviness?: string }>) ?? {}
  );

  function toggleProtein(p: string) {
    setProteins((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function handleContinue() {
    if (!active) return;
    startTransition(async () => {
      await saveGuestPreferences({
        participantId: active.id,
        allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
        dietaryRestrictions: [],
        proteinPreferences: proteins,
        dairyPreferences: [],
        mealSchedule,
      });
      await advanceWizardStep(tripId, 4);
      router.push(`/${locale}/guest/trip/${tripId}/bar`);
    });
  }

  if (!participants.length) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-12 text-center text-neutral-500">
          Complete trip details first to add guests.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeId} onValueChange={setActiveId}>
            <TabsList className="mb-6 w-full flex-wrap">
              {participants.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="flex-1">
                  {p.display_name}
                </TabsTrigger>
              ))}
            </TabsList>

            {participants.map((p) => (
              <TabsContent key={p.id} value={p.id} className="space-y-6">
                <div>
                  <Label className="text-red-600">{t("allergies")}</Label>
                  <Input
                    className="mt-2 allergy-critical"
                    placeholder={t("allergiesPlaceholder")}
                    value={p.id === activeId ? allergies : (p.guest_preferences?.allergies ?? []).join(", ")}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>

                <div>
                  <Label>{t("proteins")}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PROTEINS.map((protein) => (
                      <Button
                        key={protein}
                        type="button"
                        size="sm"
                        variant={proteins.includes(protein) ? "gold" : "outline"}
                        onClick={() => toggleProtein(protein)}
                      >
                        {protein.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <div key={meal} className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>{t(meal)}</Label>
                      <Input
                        type="time"
                        className="mt-2"
                        value={mealSchedule[meal]?.time ?? ""}
                        onChange={(e) =>
                          setMealSchedule((s) => ({
                            ...s,
                            [meal]: { ...s[meal], time: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>{t("heaviness." + HEAVINESS[0])}</Label>
                      <Select
                        value={mealSchedule[meal]?.heaviness ?? "moderate"}
                        onValueChange={(v) =>
                          setMealSchedule((s) => ({
                            ...s,
                            [meal]: { ...s[meal], heaviness: v },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
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
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gold" size="lg" onClick={handleContinue} disabled={pending}>
          {tc("continue")}
        </Button>
      </div>
    </div>
  );
}
