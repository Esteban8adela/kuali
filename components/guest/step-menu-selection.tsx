"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveMenuSelection, advanceWizardStep, saveDraftAndExit } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { RequiredMark } from "@/components/ui/required-mark";
import { isKidsMenuConfigValid, isMenuItineraryComplete } from "@/lib/guest/menu-itinerary";

type MealKey = "breakfast" | "lunch" | "dinner";

interface MealBlock {
  key: MealKey;
  heaviness: string;
  kidsMenuCount: number;
  kidsMenuNotes: string;
  dishes: string[];
}

interface DayPlan {
  date: string;
  meals: MealBlock[];
}

interface InitialMenuSelection {
  menu_id: string | null;
  selection_type: string;
  custom_notes: string | null;
}

interface StepMenuSelectionProps {
  tripId: string;
  locale: string;
  startDate?: string | null;
  endDate?: string | null;
  childCount?: number;
  initialSelection?: InitialMenuSelection;
}

const MAX_ITINERARY_DAYS = 30;
const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner"];
const HEAVINESS = ["light", "moderate", "heavy"] as const;

function newMeal(key: MealKey): MealBlock {
  return { key, heaviness: "", kidsMenuCount: 0, kidsMenuNotes: "", dishes: [""] };
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);

  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDays(startDate?: string | null, endDate?: string | null): DayPlan[] {
  if (!startDate || !endDate) return [];

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return [];

  const startMs = start.getTime();
  const endMs = end.getTime();
  if (endMs < startMs) return [];

  const ONE_DAY_MS = 86_400_000;
  const days: DayPlan[] = [];
  let currentDate = new Date(startMs);
  let safeCount = 0;

  while (currentDate.getTime() <= endMs) {
    if (safeCount > MAX_ITINERARY_DAYS) break;

    days.push({
      date: formatDateOnly(currentDate),
      meals: [newMeal("breakfast"), newMeal("lunch"), newMeal("dinner")],
    });

    currentDate = new Date(currentDate.getTime() + ONE_DAY_MS);
    safeCount += 1;
  }

  return days;
}

function normalizeMeal(raw: Record<string, unknown>): MealBlock {
  const key = (raw.key as MealKey) ?? "breakfast";
  let kidsMenuCount = 0;
  if (typeof raw.kidsMenuCount === "number") {
    kidsMenuCount = raw.kidsMenuCount;
  } else if (raw.kidsMenu === true) {
    kidsMenuCount = 1;
  }
  return {
    key,
    heaviness: typeof raw.heaviness === "string" ? raw.heaviness : "",
    kidsMenuCount,
    kidsMenuNotes: typeof raw.kidsMenuNotes === "string" ? raw.kidsMenuNotes : "",
    dishes: Array.isArray(raw.dishes) ? (raw.dishes as string[]) : [""],
  };
}

function parseInitialPlans(raw: string | null): DayPlan[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { itinerary?: Array<{ date: string; meals: Record<string, unknown>[] }> };
    const itinerary = parsed.itinerary;
    if (!Array.isArray(itinerary)) return [];
    return itinerary.slice(0, MAX_ITINERARY_DAYS).map((day) => ({
      date: day.date,
      meals: Array.isArray(day.meals)
        ? day.meals.map((m) => normalizeMeal(m))
        : [newMeal("breakfast"), newMeal("lunch"), newMeal("dinner")],
    }));
  } catch {
    return [];
  }
}

export function StepMenuSelection({
  tripId,
  locale,
  startDate,
  endDate,
  childCount = 0,
  initialSelection,
}: StepMenuSelectionProps) {
  const t = useTranslations("guest.wizard.menu");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const dateRangeKey = `${startDate ?? ""}|${endDate ?? ""}`;
  const rangeKeyRef = useRef(dateRangeKey);

  const [days, setDays] = useState<DayPlan[]>(() => {
    const fromDb = parseInitialPlans(initialSelection?.custom_notes ?? null);
    if (fromDb.length > 0) return fromDb;
    return buildDays(startDate, endDate);
  });

  useEffect(() => {
    if (rangeKeyRef.current === dateRangeKey) return;
    rangeKeyRef.current = dateRangeKey;
    setDays(buildDays(startDate, endDate));
  }, [dateRangeKey, startDate, endDate]);

  function updateMeal(dayIndex: number, mealKey: MealKey, updater: (m: MealBlock) => MealBlock) {
    setDays((prev) =>
      prev.map((day, dIdx) =>
        dIdx !== dayIndex
          ? day
          : {
              ...day,
              meals: day.meals.map((meal) => (meal.key === mealKey ? updater(meal) : meal)),
            }
      )
    );
  }

  function addDish(dayIndex: number, mealKey: MealKey) {
    updateMeal(dayIndex, mealKey, (m) => ({ ...m, dishes: [...m.dishes, ""] }));
  }

  function setDish(dayIndex: number, mealKey: MealKey, dishIndex: number, value: string) {
    updateMeal(dayIndex, mealKey, (m) => ({
      ...m,
      dishes: m.dishes.map((d, i) => (i === dishIndex ? value : d)),
    }));
  }

  async function persistItinerary() {
    if (!days.length) return;
    await saveMenuSelection({
      tripId,
      menuId: null,
      selectionType: "custom",
      customNotes: null,
      itinerary: days,
    });
  }

  const persistRef = useRef(persistItinerary);
  persistRef.current = persistItinerary;

  const debouncedPersist = useCallback(async () => {
    await persistRef.current();
  }, []);

  useWizardAutosave(debouncedPersist, [days], days.length > 0);

  function handleContinue() {
    startTransition(async () => {
      await persistItinerary();
      await advanceWizardStep(tripId, 3);
      router.push(`/${locale}/guest/trip/${tripId}/preferences`);
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await persistItinerary();
      await saveDraftAndExit(tripId);
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  const menuComplete = isMenuItineraryComplete(days);
  const kidsConfigValid = isKidsMenuConfigValid(days);
  const canContinue = days.length > 0 && menuComplete && kidsConfigValid;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("dayByDay")}</CardDescription>
        </CardHeader>
        <CardContent>
          {days.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("noDates")}
            </p>
          ) : (
            <div className="space-y-6">
              {days.map((day, dayIndex) => (
                <Card key={`${day.date}-${dayIndex}`} className="border border-[#C4A052]/25 bg-white shadow-sm">
                  <CardHeader className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 pb-3">
                    <CardTitle className="font-display text-lg text-[#1B3A4B]">
                      {t("dayLabel", { number: dayIndex + 1, date: day.date })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {MEAL_KEYS.map((mealKey) => {
                        const meal = day.meals.find((m) => m.key === mealKey) ?? newMeal(mealKey);
                        return (
                          <div key={mealKey} className="space-y-3 rounded-lg border border-neutral-200 p-4">
                            <div>
                              <h4 className="font-medium text-[#1B3A4B]">{t(mealKey)}</h4>
                              <span className="text-xs text-neutral-500">{t(`windows.${mealKey}`)}</span>
                            </div>

                            <div>
                              <Label>
                                {t("heaviness")} <RequiredMark />
                              </Label>
                              <Select
                                value={meal.heaviness}
                                onValueChange={(v) =>
                                  updateMeal(dayIndex, mealKey, (m) => ({ ...m, heaviness: v }))
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={t("heavinessPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {HEAVINESS.map((h) => (
                                    <SelectItem key={h} value={h}>
                                      {t(`heavinessOptions.${h}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {childCount > 0 && (
                              <div>
                                <Label htmlFor={`kids-${dayIndex}-${mealKey}`}>{t("kidsMenuLabel")}</Label>
                                <Input
                                  id={`kids-${dayIndex}-${mealKey}`}
                                  type="number"
                                  min={0}
                                  max={childCount}
                                  value={meal.kidsMenuCount}
                                  onChange={(e) => {
                                    const raw = parseInt(e.target.value, 10);
                                    const next = Number.isNaN(raw) ? 0 : Math.min(childCount, Math.max(0, raw));
                                    updateMeal(dayIndex, mealKey, (m) => ({ ...m, kidsMenuCount: next }));
                                  }}
                                  className="mt-1"
                                />
                                {meal.kidsMenuCount > 0 && (
                                  <div className="mt-2">
                                    <Label htmlFor={`kids-notes-${dayIndex}-${mealKey}`}>
                                      {t("kidsMenuConfig")} <RequiredMark />
                                    </Label>
                                    <Textarea
                                      id={`kids-notes-${dayIndex}-${mealKey}`}
                                      value={meal.kidsMenuNotes}
                                      onChange={(e) =>
                                        updateMeal(dayIndex, mealKey, (m) => ({
                                          ...m,
                                          kidsMenuNotes: e.target.value,
                                        }))
                                      }
                                      placeholder={t("kidsMenuConfigPlaceholder")}
                                      className="mt-1 min-h-[56px]"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>
                                {t("dishes")} <RequiredMark />
                              </Label>
                              {meal.dishes.map((dish, dishIndex) => (
                                <Textarea
                                  key={`${dayIndex}-${mealKey}-${dishIndex}`}
                                  value={dish}
                                  onChange={(e) =>
                                    setDish(dayIndex, mealKey, dishIndex, e.target.value)
                                  }
                                  className="min-h-[56px]"
                                  placeholder={t("dishPlaceholder")}
                                />
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addDish(dayIndex, mealKey)}
                              >
                                {t("addDish")}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WizardNav
        backHref={`/${locale}/guest/trip/${tripId}/details`}
        onContinue={handleContinue}
        onSaveExit={handleSaveExit}
        continueDisabled={pending || !canContinue}
        continueHint={!kidsConfigValid ? t("kidsMenuValidationHint") : undefined}
        continueLoading={pending}
        saveExitLoading={pending}
      />
    </div>
  );
}
