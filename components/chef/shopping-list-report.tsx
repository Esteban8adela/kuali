"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatCurrency, centsToUsd } from "@/lib/utils";
import { parseSnacksPayload } from "@/lib/guest/snacks-selection";
import type { PricingCatalog } from "@/lib/pricing/fetch-pricing-catalog";
import {
  resolveAlwaysOnboardLabel,
  resolveCharcuterieLabel,
  resolveSnackItemLabel,
} from "@/lib/chef/resolve-shopping-item-label";
import { formatChefGuestDisplayName, participantGuestNumber } from "@/lib/guest/participant-names";
import { parseAllergiesFromDb } from "@/lib/guest/preference-state";
import { extractBarBottleLines } from "@/lib/chef/format-service-order";
import { resolveBarLineLabel } from "@/lib/chef/resolve-catalog-labels";
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

function MenuCell({
  rows,
  pending,
}: {
  rows: Array<{ label: string; value: string | null }>;
  pending: string;
}) {
  const visible = rows.filter((r) => r.value && r.value !== pending);
  if (!visible.length) return <span>—</span>;
  return (
    <ul className="space-y-0.5">
      {visible.map((row) => (
        <li key={row.label} className="block">
          <span className="text-neutral-500">{row.label}:</span>{" "}
          <span className="font-medium">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function priceCentsForId(catalog: PricingCatalog, map: keyof PricingCatalog, id: string): number {
  const table = catalog[map] as Record<string, number>;
  return table[id] ?? 0;
}

interface ShoppingRow {
  item: string;
  qty: number;
  unitPriceCents: number;
}

function ShoppingTable({
  title,
  rows,
  locale,
  t,
}: {
  title: string;
  rows: ShoppingRow[];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase text-neutral-600">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("noneSelected")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-300 bg-neutral-50">
              <th className="p-2 text-left font-medium">{t("itemColumn")}</th>
              <th className="p-2 text-right font-medium">{t("qtyColumn")}</th>
              <th className="p-2 text-right font-medium">{t("unitPriceColumn")}</th>
              <th className="p-2 text-right font-medium">{t("subtotalColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const subtotalCents = row.unitPriceCents * row.qty;
              return (
                <tr key={`${title}-${row.item}-${i}`} className="border-b border-neutral-200">
                  <td className="p-2">{row.item}</td>
                  <td className="p-2 text-right tabular-nums">{row.qty}</td>
                  <td className="p-2 text-right tabular-nums text-neutral-600">
                    {formatCurrency(centsToUsd(row.unitPriceCents), locale)}
                  </td>
                  <td className="p-2 text-right tabular-nums font-medium">
                    {formatCurrency(centsToUsd(subtotalCents), locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function ShoppingListReport({ data, locale }: ShoppingListReportProps) {
  const t = useTranslations("chef.shoppingList");
  const tMenu = useTranslations("guest.wizard.menu");
  const tAllergies = useTranslations("guest.wizard.preferences.allergyOptions");
  const tDiet = useTranslations("guest.wizard.preferences.dietStyles");

  const { trip, principal_guest_name, participants, itinerary, dishNames, barOrder, snacksData, tripCostUsd, pricingCatalog } =
    data;

  const pending = tMenu("noSelection");
  const dates = formatDateRange(trip.start_date, trip.end_date, locale, t("datesTbd"));
  const pax = trip.adult_count + trip.child_count;

  const foodFormatted = formatCurrency(tripCostUsd, locale);

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

  const parsedSnacks = parseSnacksPayload(snacksData);
  const barLines = extractBarBottleLines(barOrder);

  const pantryRows: ShoppingRow[] = [];
  const snackRows: ShoppingRow[] = [];
  const barRows: ShoppingRow[] = [];

  for (const id of parsedSnacks.snackItemIds) {
    snackRows.push({
      item: resolveSnackItemLabel(id, parsedSnacks, pricingCatalog.namesById),
      qty: 1,
      unitPriceCents: priceCentsForId(pricingCatalog, "snackPricesCents", id),
    });
  }
  if (parsedSnacks.otherSnack?.trim()) {
    snackRows.push({
      item: parsedSnacks.otherSnack.trim(),
      qty: 1,
      unitPriceCents: 0,
    });
  }
  for (const id of parsedSnacks.alwaysOnboardItemIds) {
    pantryRows.push({
      item: resolveAlwaysOnboardLabel(id, parsedSnacks, pricingCatalog.namesById),
      qty: 1,
      unitPriceCents: priceCentsForId(pricingCatalog, "alwaysOnboardPricesCents", id),
    });
  }
  if (parsedSnacks.otherAlways?.trim()) {
    pantryRows.push({
      item: parsedSnacks.otherAlways.trim(),
      qty: 1,
      unitPriceCents: 0,
    });
  }
  for (const id of parsedSnacks.charcuterie.meats) {
    snackRows.push({
      item: resolveCharcuterieLabel(id, "meats", parsedSnacks, pricingCatalog.namesById),
      qty: 1,
      unitPriceCents: priceCentsForId(pricingCatalog, "charcuteriePricesCents", id),
    });
  }
  for (const id of parsedSnacks.charcuterie.cheeses) {
    snackRows.push({
      item: resolveCharcuterieLabel(id, "cheeses", parsedSnacks, pricingCatalog.namesById),
      qty: 1,
      unitPriceCents: priceCentsForId(pricingCatalog, "charcuteriePricesCents", id),
    });
  }
  for (const id of parsedSnacks.charcuterie.complements) {
    pantryRows.push({
      item: resolveCharcuterieLabel(id, "complements", parsedSnacks, pricingCatalog.namesById),
      qty: 1,
      unitPriceCents: priceCentsForId(pricingCatalog, "charcuteriePricesCents", id),
    });
  }
  if (parsedSnacks.charcuterie.otherMeats?.trim()) {
    snackRows.push({
      item: parsedSnacks.charcuterie.otherMeats.trim(),
      qty: 1,
      unitPriceCents: 0,
    });
  }
  if (parsedSnacks.charcuterie.otherCheeses?.trim()) {
    snackRows.push({
      item: parsedSnacks.charcuterie.otherCheeses.trim(),
      qty: 1,
      unitPriceCents: 0,
    });
  }
  if (parsedSnacks.charcuterie.otherComplements?.trim()) {
    pantryRows.push({
      item: parsedSnacks.charcuterie.otherComplements.trim(),
      qty: 1,
      unitPriceCents: 0,
    });
  }
  for (const line of barLines) {
    const qty = line.quantity === "—" ? 1 : Math.max(1, parseInt(line.quantity, 10) || 1);
    barRows.push({
      item: resolveBarLineLabel(line, pricingCatalog.namesById),
      qty,
      unitPriceCents: line.catalogItemId
        ? priceCentsForId(pricingCatalog, "beveragePricesCents", line.catalogItemId)
        : 0,
    });
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

                  const fmtRows = (rows: Array<{ label: string; value: string | null }>) => (
                    <MenuCell rows={rows} pending={pending} />
                  );

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
          <ShoppingTable key={title} title={title} rows={rows} locale={locale} t={t} />
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
