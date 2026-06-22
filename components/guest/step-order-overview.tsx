"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { WizardNav } from "@/components/guest/wizard-nav";
import { confirmTripOrder } from "@/app/[locale]/(guest)/guest/trip/actions";
import { calculateFoodAllowanceUsd } from "@/lib/pricing/food-allowance";
import {
  extractBarBottleLines,
  extractCharcuterie,
  extractSnackKeys,
} from "@/lib/chef/format-service-order";
import type { OrderOverviewData } from "@/lib/guest/fetch-order-overview";
import type { MenuDayPlan } from "@/lib/guest/menu-itinerary";
import {
  breakfastDishRows,
  dinnerDishRows,
  lunchDishRows,
  mealByKey,
} from "@/lib/guest/menu-overview-display";

interface StepOrderOverviewProps {
  data: OrderOverviewData;
  locale: string;
}

function formatDateRange(
  start: string | null,
  end: string | null,
  locale: string
): string {
  if (!start && !end) return "—";
  const fmt = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
  });
  if (start && end) {
    return `${fmt.format(new Date(`${start}T12:00:00`))} — ${fmt.format(new Date(`${end}T12:00:00`))}`;
  }
  return fmt.format(new Date(`${(start ?? end)!}T12:00:00`));
}

function MealBlock({
  title,
  rows,
  pending,
}: {
  title: string;
  rows: Array<{ label: string; value: string | null }>;
  pending: string;
}) {
  const visible = rows.filter((row) => row.value && row.value !== pending);
  if (visible.length === 0) return null;

  return (
    <div className="rounded-md border border-neutral-200/80 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1B3A4B]">{title}</p>
      <ul className="mt-1.5 space-y-0.5 text-sm text-neutral-700">
        {visible.map((row) => (
          <li key={row.label}>
            <span className="text-neutral-500">{row.label}:</span>{" "}
            <span className="font-medium">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MenuDaySummary({
  day,
  dayIndex,
  dishNames,
  tMenu,
}: {
  day: MenuDayPlan;
  dayIndex: number;
  dishNames: Record<string, string>;
  tMenu: ReturnType<typeof useTranslations<"guest.wizard.menu">>;
}) {
  const pending = tMenu("noSelection");
  const breakfast = mealByKey(day.meals, "breakfast");
  const lunch = mealByKey(day.meals, "lunch");
  const dinner = mealByKey(day.meals, "dinner");
  const kidsLabel = tMenu("kidsMenuDish");

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3">
      <p className="text-sm font-semibold text-[#1B3A4B]">
        {tMenu("dayLabel", {
          number: dayIndex + 1,
          date: day.date,
        })}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MealBlock
          title={tMenu("breakfast")}
          pending={pending}
          rows={breakfastDishRows(breakfast, dishNames, pending, {
            breakfastDish: tMenu("breakfastDish"),
            kidsMenu: kidsLabel,
          })}
        />
        <MealBlock
          title={tMenu("lunch")}
          pending={pending}
          rows={lunchDishRows(lunch, dishNames, pending, {
            appetizer: tMenu("lunchAppetizers"),
            mainCourse: tMenu("lunchMains"),
            dessert: tMenu("lunchDessert"),
            kidsMenu: kidsLabel,
          })}
        />
        <MealBlock
          title={tMenu("dinner")}
          pending={pending}
          rows={dinnerDishRows(dinner, dishNames, pending, {
            dinnerDish: tMenu("dinnerDish"),
            kidsMenu: kidsLabel,
          })}
        />
      </div>
    </div>
  );
}

export function StepOrderOverview({ data, locale }: StepOrderOverviewProps) {
  const t = useTranslations("guest.wizard.overview");
  const tMenu = useTranslations("guest.wizard.menu");
  const tSnacks = useTranslations("guest.wizard.snacks");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDraft = data.status === "draft";
  const isSubmittedEdit = data.status === "submitted";
  const showSubmittedBadge = isSubmittedEdit || data.status === "active";
  const foodTotal = calculateFoodAllowanceUsd(
    data.adultCount,
    data.childCount,
    data.startDate,
    data.endDate
  );
  const foodFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(foodTotal);

  const snackKeys = extractSnackKeys(data.snacksData, "snacks");
  const alwaysKeys = extractSnackKeys(data.snacksData, "alwaysOnboard");
  const charcuterie = extractCharcuterie(data.snacksData);
  const barLines = extractBarBottleLines(data.barOrder);
  const byob = Boolean(data.barOrder.byob);
  const specificRequest =
    typeof data.barOrder.specific_bottle_request === "string"
      ? data.barOrder.specific_bottle_request.trim()
      : "";

  function snackLabel(key: string, field: "items" | "alwaysItems", otherText: string | null) {
    if (key === "other" && otherText) return otherText;
    return field === "items"
      ? tSnacks(`items.${key}` as "items.chips")
      : tSnacks(`alwaysItems.${key}` as "alwaysItems.pico_de_gallo");
  }

  function charcuterieLabels(
    keys: string[],
    prefix: "meats" | "cheeses" | "complements",
    otherText: string | null
  ) {
    return keys.map((key) => {
      if (key === "other" && otherText) return otherText;
      return tSnacks(`charcuterieItems.${prefix}.${key}` as "charcuterieItems.meats.serrano_ham");
    });
  }

  function handlePrimaryAction() {
    startTransition(async () => {
      try {
        setError(null);
        if (isDraft) {
          await confirmTripOrder(data.tripId);
        }
        router.push(`/${locale}/guest/dashboard`);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("confirmError"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </div>
            {showSubmittedBadge ? (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-800">
                {t("alreadySubmitted")}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1B3A4B]">
              {t("tripSection")}
            </h3>
            <div className="rounded-xl border border-[#1B3A4B]/15 bg-white p-5 text-sm">
              <p>
                <span className="font-medium text-neutral-600">{t("dates")}:</span>{" "}
                {formatDateRange(data.startDate, data.endDate, locale)}
              </p>
              <p className="mt-2">
                <span className="font-medium text-neutral-600">{t("passengers")}:</span>{" "}
                {t("passengersValue", {
                  guests: data.adultCount + data.childCount,
                  adults: data.adultCount,
                  children: data.childCount,
                  crew: data.crewCount,
                })}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1B3A4B]">
              {t("menuSection")}
            </h3>
            {data.itinerary.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("noMenu")}</p>
            ) : (
              <div className="space-y-3">
                {data.itinerary.map((day, index) => (
                  <MenuDaySummary
                    key={day.date}
                    day={day}
                    dayIndex={index}
                    dishNames={data.dishNames}
                    tMenu={tMenu}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1B3A4B]">
              {t("snacksSection")}
            </h3>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
              <p>
                <span className="font-medium">{t("snacksLabel")}:</span>{" "}
                {snackKeys.length
                  ? snackKeys
                      .map((k) =>
                        snackLabel(
                          k,
                          "items",
                          typeof data.snacksData.otherSnack === "string"
                            ? data.snacksData.otherSnack
                            : null
                        )
                      )
                      .join(", ")
                  : t("noneSelected")}
              </p>
              <p className="mt-2">
                <span className="font-medium">{t("alwaysOnboardLabel")}:</span>{" "}
                {alwaysKeys.length
                  ? alwaysKeys
                      .map((k) =>
                        snackLabel(
                          k,
                          "alwaysItems",
                          typeof data.snacksData.otherAlways === "string"
                            ? data.snacksData.otherAlways
                            : null
                        )
                      )
                      .join(", ")
                  : t("noneSelected")}
              </p>
              {(charcuterie.meats.length > 0 ||
                charcuterie.cheeses.length > 0 ||
                charcuterie.complements.length > 0) && (
                <p className="mt-2">
                  <span className="font-medium">{t("charcuterieLabel")}:</span>{" "}
                  {[
                    ...charcuterieLabels(charcuterie.meats, "meats", charcuterie.otherMeats),
                    ...charcuterieLabels(charcuterie.cheeses, "cheeses", charcuterie.otherCheeses),
                    ...charcuterieLabels(
                      charcuterie.complements,
                      "complements",
                      charcuterie.otherComplements
                    ),
                  ].join(", ")}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1B3A4B]">
              {t("barSection")}
            </h3>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
              {byob ? <p>{t("byob")}</p> : null}
              {specificRequest ? (
                <p className={byob ? "mt-2" : ""}>
                  <span className="font-medium">{t("specificRequest")}:</span> {specificRequest}
                </p>
              ) : null}
              {barLines.length > 0 ? (
                <ul className={`space-y-1 ${byob || specificRequest ? "mt-2" : ""}`}>
                  {barLines.map((line, i) => (
                    <li key={`${line.category}-${line.label}-${i}`}>
                      {line.label}
                      {line.quantity !== "—" ? ` × ${line.quantity}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                !byob && !specificRequest && <p>{t("noBarSelections")}</p>
              )}
            </div>
          </section>

          <Separator />

          <section className="rounded-xl border-2 border-[#C4A052]/40 bg-[#C4A052]/5 p-6">
            <h3 className="font-display text-xl text-[#1B3A4B]">{t("foodBudgetTitle")}</h3>
            <p className="mt-2 text-3xl font-semibold text-[#1B3A4B]">{foodFormatted}</p>
            <p className="mt-3 text-xs text-gray-500">{t("foodBudgetDisclaimer")}</p>
            <p className="mt-2 text-sm text-neutral-600">{t("finalCostNote")}</p>
          </section>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <WizardNav
        backHref={`/${locale}/guest/trip/${data.tripId}/bar`}
        onContinue={handlePrimaryAction}
        continueLabel={isDraft ? t("confirmOrder") : t("saveAndReturn")}
        continueDisabled={pending}
        continueLoading={pending}
      />
    </div>
  );
}
