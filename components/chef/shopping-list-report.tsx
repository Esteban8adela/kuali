"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { calculateFoodAllowanceUsd } from "@/lib/pricing/food-allowance";
import { formatChefGuestDisplayName, participantGuestNumber } from "@/lib/guest/participant-names";
import { parseAllergiesFromDb } from "@/lib/guest/preference-state";
import {
  extractBarBottleLines,
  extractCharcuterie,
  extractSnackKeys,
} from "@/lib/chef/format-service-order";
import {
  breakfastDishRows,
  dinnerDishRows,
  lunchDishRows,
  mealByKey,
} from "@/lib/guest/menu-overview-display";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import type { ChefTripDetailsPayload } from "@/app/[locale]/(chef)/chef/chef-actions";

interface ShoppingListReportProps {
  data: ChefTripDetailsPayload;
  locale: string;
}

function formatDateRange(
  start: string | null,
  end: string | null,
  locale: string,
  tbd: string
): string {
  const startNorm = normalizeDateOnlyInput(start);
  const endNorm = normalizeDateOnlyInput(end);
  if (!startNorm && !endNorm) return tbd;
  const fmt = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "long",
  });
  if (startNorm && endNorm) {
    return `${fmt.format(new Date(`${startNorm}T12:00:00`))} — ${fmt.format(new Date(`${endNorm}T12:00:00`))}`;
  }
  return fmt.format(new Date(`${(startNorm ?? endNorm)!}T12:00:00`));
}

function zeroPrice(locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(0);
}

export function ShoppingListReport({ data, locale }: ShoppingListReportProps) {
  const t = useTranslations("chef.shoppingList");
  const tMenu = useTranslations("guest.wizard.menu");
  const tSnacks = useTranslations("guest.wizard.snacks");
  const tAllergies = useTranslations("guest.wizard.preferences.allergyOptions");
  const tDiet = useTranslations("guest.wizard.preferences.dietStyles");

  const { trip, principal_guest_name, participants, itinerary, dishNames, barOrder, snacksData } =
    data;

  const zeroUsd = useMemo(() => zeroPrice(locale), [locale]);
  const pending = tMenu("noSelection");
  const dates = formatDateRange(trip.start_date, trip.end_date, locale, t("datesTbd"));
  const pax = trip.adult_count + trip.child_count;

  const foodTotal = calculateFoodAllowanceUsd(
    trip.adult_count,
    trip.child_count,
    trip.start_date,
    trip.end_date
  );
  const foodFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(foodTotal);

  const attentionAlerts = participants
    .map((participant) => {
      const prefs = participant.guest_preferences;
      const allergies: string[] = [];
      if (prefs && !prefs.no_dietary_restrictions) {
        const { allergies: keys, allergiesOther } = parseAllergiesFromDb(prefs.allergies ?? []);
        for (const key of keys) {
          if (key === "other" && allergiesOther.trim()) allergies.push(allergiesOther.trim());
          else allergies.push(tAllergies(key as "gluten"));
        }
      }
      const dietKey = prefs?.dietary_restrictions?.[0]?.trim();
      const diet = dietKey ? tDiet(dietKey as "vegan") : null;
      const comments = prefs?.general_food_notes?.[0]?.trim() || null;
      if (!allergies.length && !diet && !comments) return null;

      const guestType = participant.participant_type as "adult" | "child";
      const guestNumber = participantGuestNumber(participants, participant.id, guestType);
      const name = formatChefGuestDisplayName(
        participant.display_name,
        guestType,
        guestNumber,
        locale
      );

      return { name, guestType, allergies, diet, comments };
    })
    .filter(Boolean) as Array<{
    name: string;
    guestType: string;
    allergies: string[];
    diet: string | null;
    comments: string | null;
  }>;

  const snackKeys = extractSnackKeys(snacksData, "snacks");
  const alwaysKeys = extractSnackKeys(snacksData, "alwaysOnboard");
  const otherSnack = typeof snacksData.otherSnack === "string" ? snacksData.otherSnack : "";
  const otherAlways = typeof snacksData.otherAlways === "string" ? snacksData.otherAlways : "";
  const charcuterie = extractCharcuterie(snacksData);
  const barLines = extractBarBottleLines(barOrder);

  function snackLabel(key: string, otherText: string) {
    if (key === "other" && otherText) return otherText;
    return tSnacks(`items.${key}` as "items.chips");
  }

  function alwaysLabel(key: string, otherText: string) {
    if (key === "other" && otherText) return otherText;
    return tSnacks(`alwaysItems.${key}` as "alwaysItems.pico_de_gallo");
  }

  const pantryRows: Array<{ item: string; qty: string }> = [];
  const snackRows: Array<{ item: string; qty: string }> = [];
  const barRows: Array<{ item: string; qty: string }> = [];

  for (const key of snackKeys) {
    snackRows.push({ item: snackLabel(key, otherSnack), qty: "1" });
  }
  for (const key of alwaysKeys) {
    pantryRows.push({ item: alwaysLabel(key, otherAlways), qty: "1" });
  }
  for (const key of charcuterie.meats) {
    snackRows.push({
      item:
        key === "other" && charcuterie.otherMeats
          ? charcuterie.otherMeats
          : tSnacks(`charcuterieItems.meats.${key}` as "charcuterieItems.meats.serrano_ham"),
      qty: "1",
    });
  }
  for (const key of charcuterie.cheeses) {
    snackRows.push({
      item:
        key === "other" && charcuterie.otherCheeses
          ? charcuterie.otherCheeses
          : tSnacks(`charcuterieItems.cheeses.${key}` as "charcuterieItems.cheeses.brie"),
      qty: "1",
    });
  }
  for (const key of charcuterie.complements) {
    pantryRows.push({
      item:
        key === "other" && charcuterie.otherComplements
          ? charcuterie.otherComplements
          : tSnacks(
              `charcuterieItems.complements.${key}` as "charcuterieItems.complements.grapes"
            ),
      qty: "1",
    });
  }
  for (const line of barLines) {
    barRows.push({ item: line.label, qty: line.quantity === "—" ? "1" : line.quantity });
  }

  return (
    <div className="shopping-list-print mx-auto max-w-4xl bg-white text-black print:max-w-none print:p-0">
      <div className="no-print mb-6 flex justify-end">
        <Button type="button" variant="gold" onClick={() => window.print()}>
          {t("printButton")}
        </Button>
      </div>

      <header className="border-b-2 border-[#1B3A4B] pb-6 print:border-black">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C4A052] print:text-black">
          Kualisto
        </p>
        <h1 className="mt-2 font-display text-3xl text-[#1B3A4B] print:text-2xl print:text-black">
          {t("title")}
        </h1>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-neutral-600">{t("dates")}</dt>
            <dd>{dates}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-600">{t("principalGuest")}</dt>
            <dd>{principal_guest_name}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-neutral-600">{t("passengers")}</dt>
            <dd>
              {t("passengersValue", {
                total: pax,
                adults: trip.adult_count,
                children: trip.child_count,
                crew: trip.crew_count,
              })}
            </dd>
          </div>
        </dl>
      </header>

      {attentionAlerts.length > 0 ? (
        <section className="mt-6 rounded-lg border-2 border-red-500 bg-red-50 p-4 print:break-inside-avoid print:border-red-600">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-800">
            {t("allergyAlerts")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-red-900">
            {attentionAlerts.map((alert) => (
              <li key={alert.name}>
                <span className="font-bold">{alert.name}</span>
                {alert.allergies.length > 0 ? (
                  <span> — {t("allergies")}: {alert.allergies.join(", ")}</span>
                ) : null}
                {alert.diet ? <span> — {t("diet")}: {alert.diet}</span> : null}
                {alert.comments ? <span> — {alert.comments}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 print:break-inside-avoid">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#1B3A4B]">
          {t("menuSummary")}
        </h2>
        {!itinerary.length ? (
          <p className="text-sm text-neutral-600">{t("noMenu")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100">
                  <th className="px-2 py-2 text-left font-semibold">{t("dayColumn")}</th>
                  <th className="px-2 py-2 text-left font-semibold">{tMenu("breakfast")}</th>
                  <th className="px-2 py-2 text-left font-semibold">{tMenu("lunch")}</th>
                  <th className="px-2 py-2 text-left font-semibold">{tMenu("dinner")}</th>
                </tr>
              </thead>
              <tbody>
                {itinerary.map((day, index) => {
                  const breakfast = mealByKey(day.meals, "breakfast");
                  const lunch = mealByKey(day.meals, "lunch");
                  const dinner = mealByKey(day.meals, "dinner");

                  const fmtRows = (rows: Array<{ label: string; value: string | null }>) =>
                    rows
                      .filter((r) => r.value && r.value !== pending)
                      .map((r) => `${r.label}: ${r.value}`)
                      .join(" · ") || "—";

                  return (
                    <tr key={day.date} className="border-b border-neutral-200 align-top">
                      <td className="px-2 py-2 font-medium">
                        {tMenu("dayLabel", { number: index + 1, date: day.date })}
                      </td>
                      <td className="px-2 py-2">
                        {fmtRows(
                          breakfastDishRows(breakfast, dishNames, pending, {
                            breakfastDish: tMenu("breakfastDish"),
                            kidsMenu: tMenu("kidsMenuDish"),
                          })
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {fmtRows(
                          lunchDishRows(lunch, dishNames, pending, {
                            appetizer: tMenu("lunchAppetizers"),
                            mainCourse: tMenu("lunchMains"),
                            dessert: tMenu("lunchDessert"),
                            kidsMenu: tMenu("kidsMenuDish"),
                          })
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {fmtRows(
                          dinnerDishRows(dinner, dishNames, pending, {
                            dinnerDish: tMenu("dinnerDish"),
                            kidsMenu: tMenu("kidsMenuDish"),
                          })
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 space-y-6 print:break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B3A4B]">
          {t("shoppingSection")}
        </h2>

        {[
          { title: t("pantrySection"), rows: pantryRows },
          { title: t("snacksSection"), rows: snackRows },
          { title: t("barSection"), rows: barRows },
        ].map(({ title, rows }) => (
          <div key={title}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-neutral-600">{title}</h3>
            {rows.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("noneSelected")}</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-50">
                    <th className="px-2 py-1.5 text-left font-medium">{t("itemColumn")}</th>
                    <th className="px-2 py-1.5 text-left font-medium">{t("qtyColumn")}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{t("unitPriceColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={`${title}-${row.item}-${i}`} className="border-b border-neutral-100">
                      <td className="px-2 py-1.5">{row.item}</td>
                      <td className="px-2 py-1.5">{row.qty}</td>
                      <td className="px-2 py-1.5 text-right text-neutral-500">{zeroUsd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>

      <section className="mt-8 border-t-2 border-[#C4A052] pt-4 print:break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B3A4B]">
          {t("costingSection")}
        </h2>
        <p className="mt-2 text-2xl font-semibold text-[#1B3A4B]">{foodFormatted}</p>
        <p className="mt-1 text-xs text-neutral-600">{t("foodAllowanceNote")}</p>
        <p className="mt-2 text-xs text-neutral-500">{t("costingDisclaimer")}</p>
      </section>
    </div>
  );
}
