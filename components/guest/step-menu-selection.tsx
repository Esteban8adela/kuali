"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveMenuSelection, advanceWizardStep, saveDraftAndExit } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { DishSinglePicker } from "@/components/guest/dish-single-picker";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { RequiredMark } from "@/components/ui/required-mark";
import {
  isKidsMenuConfigValid,
  isMenuItineraryComplete,
  parseMenuOrder,
  type MenuDayPlan,
  type MenuMealBlock,
} from "@/lib/guest/menu-itinerary";
import { buildItineraryDates } from "@/lib/trip/itinerary-days";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import type { DishesByCategory } from "@/lib/guest/fetch-dishes-catalog";

type MealKey = "breakfast" | "lunch" | "dinner";

interface MealBlock {
  key: MealKey;
  heaviness: string;
  kidsMenuCount: number;
  selected_kids_dish_id: string | null;
  selected_dish_id: string | null;
  selected_appetizer_id: string | null;
  selected_main_id: string | null;
}

interface DayPlan {
  date: string;
  meals: MealBlock[];
}

interface StepMenuSelectionProps {
  tripId: string;
  locale: string;
  startDate?: string | null;
  endDate?: string | null;
  childCount?: number;
  initialMenuOrder?: unknown;
  dishesByCategory: DishesByCategory;
}

const MAX_ITINERARY_DAYS = 30;
const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner"];
const HEAVINESS = ["light", "moderate", "heavy"] as const;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstUuid(ids: string[] | undefined): string | null {
  const found = (ids ?? []).find((id) => UUID_RE.test(id));
  return found ?? null;
}

function newMeal(key: MealKey): MealBlock {
  return {
    key,
    heaviness: "",
    kidsMenuCount: 0,
    selected_kids_dish_id: null,
    selected_dish_id: null,
    selected_appetizer_id: null,
    selected_main_id: null,
  };
}

function buildDays(startDate?: string | null, endDate?: string | null): DayPlan[] {
  const dates = buildItineraryDates(startDate, endDate, MAX_ITINERARY_DAYS);
  return dates.map((date) => ({
    date,
    meals: [newMeal("breakfast"), newMeal("lunch"), newMeal("dinner")],
  }));
}

function normalizeMeal(raw: Record<string, unknown>): MealBlock {
  const key = (raw.key as MealKey) ?? "breakfast";
  let kidsMenuCount = 0;
  if (typeof raw.kidsMenuCount === "number") {
    kidsMenuCount = raw.kidsMenuCount;
  } else if (raw.kidsMenu === true) {
    kidsMenuCount = 1;
  }

  const legacyIds = Array.isArray(raw.dishes)
    ? (raw.dishes as string[]).filter((id) => UUID_RE.test(id))
    : [];

  const selectedKids =
    typeof raw.selected_kids_dish_id === "string" && UUID_RE.test(raw.selected_kids_dish_id)
      ? raw.selected_kids_dish_id
      : null;

  if (key === "lunch") {
    const appetizerId =
      typeof raw.selected_appetizer_id === "string" && UUID_RE.test(raw.selected_appetizer_id)
        ? raw.selected_appetizer_id
        : firstUuid(raw.selected_appetizers as string[] | undefined);
    const mainId =
      typeof raw.selected_main_id === "string" && UUID_RE.test(raw.selected_main_id)
        ? raw.selected_main_id
        : firstUuid(raw.selected_mains as string[] | undefined) ?? legacyIds[0] ?? null;

    return {
      key: "lunch",
      heaviness: typeof raw.heaviness === "string" ? raw.heaviness : "",
      kidsMenuCount,
      selected_kids_dish_id: selectedKids,
      selected_dish_id: null,
      selected_appetizer_id: appetizerId,
      selected_main_id: mainId,
    };
  }

  const dishId =
    typeof raw.selected_dish_id === "string" && UUID_RE.test(raw.selected_dish_id)
      ? raw.selected_dish_id
      : firstUuid(raw.selected_dishes as string[] | undefined) ?? legacyIds[0] ?? null;

  return {
    key,
    heaviness: typeof raw.heaviness === "string" ? raw.heaviness : "",
    kidsMenuCount,
    selected_kids_dish_id: selectedKids,
    selected_dish_id: dishId,
    selected_appetizer_id: null,
    selected_main_id: null,
  };
}

function serializeMeal(meal: MealBlock): MenuMealBlock {
  const base = {
    key: meal.key,
    heaviness: meal.heaviness,
    kidsMenuCount: meal.kidsMenuCount,
    selected_kids_dish_id: meal.selected_kids_dish_id,
  };

  if (meal.key === "lunch") {
    return {
      ...base,
      selected_appetizer_id: meal.selected_appetizer_id,
      selected_main_id: meal.selected_main_id,
    };
  }

  return {
    ...base,
    selected_dish_id: meal.selected_dish_id,
  };
}

function parseInitialPlans(menuOrder: unknown): DayPlan[] {
  const itinerary = parseMenuOrder(menuOrder);
  if (!itinerary.length) return [];

  return itinerary.slice(0, MAX_ITINERARY_DAYS).map((day) => ({
    date: day.date,
    meals: Array.isArray(day.meals)
      ? day.meals.map((m) => normalizeMeal(m as unknown as Record<string, unknown>))
      : [newMeal("breakfast"), newMeal("lunch"), newMeal("dinner")],
  }));
}

export function StepMenuSelection({
  tripId,
  locale,
  startDate,
  endDate,
  childCount = 0,
  initialMenuOrder,
  dishesByCategory,
}: StepMenuSelectionProps) {
  const t = useTranslations("guest.wizard.menu");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tripStart = normalizeDateOnlyInput(startDate);
  const tripEnd = normalizeDateOnlyInput(endDate);
  const hasTripDates = Boolean(tripStart && tripEnd);

  const dateRangeKey = `${tripStart ?? ""}|${tripEnd ?? ""}`;
  const rangeKeyRef = useRef(dateRangeKey);

  const [days, setDays] = useState<DayPlan[]>(() => {
    const fromDb = parseInitialPlans(initialMenuOrder);
    if (fromDb.length > 0) return fromDb;
    return buildDays(tripStart, tripEnd);
  });

  useEffect(() => {
    if (rangeKeyRef.current === dateRangeKey) return;
    rangeKeyRef.current = dateRangeKey;
    setDays(buildDays(tripStart, tripEnd));
  }, [dateRangeKey, tripStart, tripEnd]);

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

  const serializedDays: MenuDayPlan[] = useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        meals: day.meals.map(serializeMeal),
      })),
    [days]
  );

  const menuComplete = useMemo(
    () => isMenuItineraryComplete(serializedDays),
    [serializedDays]
  );
  const kidsConfigValid = useMemo(() => isKidsMenuConfigValid(days), [days]);
  const stepComplete = menuComplete && kidsConfigValid;
  const canContinue = hasTripDates && days.length > 0 && stepComplete;

  const continueHint = !menuComplete
    ? t("menuIncompleteHint")
    : !kidsConfigValid
      ? t("kidsMenuValidationHint")
      : undefined;

  async function persistItinerary() {
    if (!days.length) return;
    await saveMenuSelection({
      tripId,
      menuId: null,
      selectionType: "custom",
      customNotes: null,
      itinerary: serializedDays,
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

  if (!hasTripDates) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("dayByDay")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("noDates")}
            </p>
          </CardContent>
        </Card>
        <WizardNav backHref={`/${locale}/guest/trip/${tripId}/details`} continueDisabled />
      </div>
    );
  }

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
              {t("datesRangeInvalid")}
            </p>
          ) : (
            <div className="space-y-6">
              {days.map((day, dayIndex) => (
                <Card
                  key={`${day.date}-${dayIndex}`}
                  className="border border-[#C4A052]/25 bg-white shadow-sm"
                >
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
                          <div
                            key={mealKey}
                            className="space-y-3 rounded-lg border border-neutral-200 p-4"
                          >
                            <div>
                              <h4 className="font-medium text-[#1B3A4B]">{t(mealKey)}</h4>
                              <span className="text-xs text-neutral-500">
                                {t(`windows.${mealKey}`)}
                              </span>
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
                                <Label htmlFor={`kids-${dayIndex}-${mealKey}`}>
                                  {t("kidsMenuLabel")}
                                </Label>
                                <Input
                                  id={`kids-${dayIndex}-${mealKey}`}
                                  type="number"
                                  min={0}
                                  max={childCount}
                                  value={meal.kidsMenuCount}
                                  onChange={(e) => {
                                    const raw = parseInt(e.target.value, 10);
                                    const next = Number.isNaN(raw)
                                      ? 0
                                      : Math.min(childCount, Math.max(0, raw));
                                    updateMeal(dayIndex, mealKey, (m) => ({
                                      ...m,
                                      kidsMenuCount: next,
                                      selected_kids_dish_id:
                                        next > 0 ? m.selected_kids_dish_id : null,
                                    }));
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            )}

                            {mealKey === "breakfast" && (
                              <DishSinglePicker
                                label={t("breakfastDish")}
                                dishes={dishesByCategory.breakfast}
                                value={meal.selected_dish_id}
                                onChange={(id) =>
                                  updateMeal(dayIndex, "breakfast", (m) => ({
                                    ...m,
                                    selected_dish_id: id,
                                  }))
                                }
                                required
                              />
                            )}

                            {mealKey === "lunch" && (
                              <>
                                <DishSinglePicker
                                  label={t("lunchAppetizers")}
                                  dishes={dishesByCategory.lunch_appetizer}
                                  value={meal.selected_appetizer_id}
                                  onChange={(id) =>
                                    updateMeal(dayIndex, "lunch", (m) => ({
                                      ...m,
                                      selected_appetizer_id: id,
                                    }))
                                  }
                                  optional
                                />
                                <DishSinglePicker
                                  label={t("lunchMains")}
                                  dishes={dishesByCategory.lunch_main}
                                  value={meal.selected_main_id}
                                  onChange={(id) =>
                                    updateMeal(dayIndex, "lunch", (m) => ({
                                      ...m,
                                      selected_main_id: id,
                                    }))
                                  }
                                  required
                                />
                              </>
                            )}

                            {mealKey === "dinner" && (
                              <DishSinglePicker
                                label={t("dinnerDish")}
                                dishes={dishesByCategory.dinner}
                                value={meal.selected_dish_id}
                                onChange={(id) =>
                                  updateMeal(dayIndex, "dinner", (m) => ({
                                    ...m,
                                    selected_dish_id: id,
                                  }))
                                }
                                required
                              />
                            )}

                            {childCount > 0 && meal.kidsMenuCount > 0 && (
                              <DishSinglePicker
                                label={t("kidsMenuDish")}
                                dishes={dishesByCategory.kids}
                                value={meal.selected_kids_dish_id}
                                onChange={(id) =>
                                  updateMeal(dayIndex, mealKey, (m) => ({
                                    ...m,
                                    selected_kids_dish_id: id,
                                  }))
                                }
                                required
                              />
                            )}
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
        continueHint={continueHint}
        continueLoading={pending}
        saveExitLoading={pending}
      />
    </div>
  );
}
