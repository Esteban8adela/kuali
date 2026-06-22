import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GenerateShoppingListButton } from "@/components/chef/generate-shopping-list-button";
import { parseAllergiesFromDb } from "@/lib/guest/preference-state";
import {
  extractBarBottleLines,
  extractCharcuterie,
  extractSnackKeys,
} from "@/lib/chef/format-service-order";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import type { ChefTripDetailsPayload, ChefTripParticipant } from "@/app/[locale]/(chef)/chef/chef-actions";
import type { MenuMealBlock } from "@/lib/guest/menu-itinerary";

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

function resolveDishName(id: string | null | undefined, dishNames: Record<string, string>, pending: string) {
  if (!id) return null;
  return dishNames[id] ?? pending;
}

function mealByKey(meals: MenuMealBlock[], key: string): MenuMealBlock | undefined {
  return meals.find((meal) => meal.key === key);
}

interface GuestAlert {
  guestName: string;
  guestType: string;
  lines: string[];
  critical: boolean;
}

function buildGuestAlerts(
  participants: ChefTripParticipant[],
  allergyLabel: (key: string) => string,
  dietLabel: (key: string) => string,
  noRestrictionsLabel: string
): GuestAlert[] {
  return participants
    .map((participant) => {
      const prefs = participant.guest_preferences;
      if (!prefs) return null;

      const lines: string[] = [];
      let critical = false;

      if (prefs.no_dietary_restrictions) {
        lines.push(noRestrictionsLabel);
      } else {
        const { allergies, allergiesOther } = parseAllergiesFromDb(prefs.allergies ?? []);
        for (const allergy of allergies) {
          if (allergy === "other") {
            if (allergiesOther.trim()) lines.push(allergiesOther.trim());
          } else {
            lines.push(allergyLabel(allergy));
          }
        }
        for (const diet of prefs.dietary_restrictions ?? []) {
          if (diet.trim()) lines.push(dietLabel(diet));
        }
        for (const note of prefs.general_food_notes ?? []) {
          if (note.trim()) lines.push(note.trim());
        }
        critical = allergies.length > 0 || Boolean(allergiesOther.trim());
      }

      if (!lines.length) return null;

      return {
        guestName: participant.display_name,
        guestType: participant.participant_type,
        lines,
        critical,
      };
    })
    .filter((item): item is GuestAlert => item !== null);
}

interface ServiceOrderReportProps {
  data: ChefTripDetailsPayload;
  locale: string;
}

export async function ServiceOrderReport({ data, locale }: ServiceOrderReportProps) {
  const t = await getTranslations("chef.serviceOrder");
  const tSnacks = await getTranslations("guest.wizard.snacks");
  const tAllergies = await getTranslations("guest.wizard.preferences.allergyOptions");
  const tDiet = await getTranslations("guest.wizard.preferences.dietStyles");
  const tMenu = await getTranslations("guest.wizard.menu");

  const { trip, participants, itinerary, dishNames, barOrder, snacksData } = data;
  const pax = trip.adult_count + trip.child_count;
  const dates = formatDateRange(trip.start_date, trip.end_date, locale, t("datesTbd"));
  const guestAlerts = buildGuestAlerts(
    participants,
    (key) => tAllergies(key as "gluten"),
    (key) => tDiet(key as "vegan"),
    t("noRestrictions")
  );
  const criticalAlerts = guestAlerts.filter((alert) => alert.critical);

  const snackKeys = extractSnackKeys(snacksData, "snacks");
  const alwaysKeys = extractSnackKeys(snacksData, "alwaysOnboard");
  const otherSnack = typeof snacksData.otherSnack === "string" ? snacksData.otherSnack : "";
  const otherAlways = typeof snacksData.otherAlways === "string" ? snacksData.otherAlways : "";
  const charcuterie = extractCharcuterie(snacksData);

  const barLines = extractBarBottleLines(barOrder);
  const byob = Boolean(barOrder.byob);
  const specificRequest =
    typeof barOrder.specific_bottle_request === "string" ? barOrder.specific_bottle_request.trim() : "";

  const dishPending = t("dishPending");

  function charcuterieLabels(
    keys: string[],
    prefix: "meats" | "cheeses" | "complements",
    otherText: string | null
  ): string[] {
    return keys.map((key) => {
      if (key === "other" && otherText) return otherText;
      return tSnacks(`charcuterieItems.${prefix}.${key}` as "charcuterieItems.meats.serrano_ham");
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/${locale}/chef/dashboard`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1B3A4B] hover:text-[#C4A052]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToDashboard")}
        </Link>
        <GenerateShoppingListButton label={t("generateShoppingList")} tripId={trip.id} />
      </div>

      <header className="rounded-2xl border border-[#1B3A4B]/15 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C4A052]">
          {t("serviceOrder")}
        </p>
        <h1 className="mt-2 font-display text-3xl text-[#1B3A4B] md:text-4xl">
          {trip.notes?.trim() ? trip.notes.trim() : t("tripRef", { id: trip.id.slice(0, 8).toUpperCase() })}
        </h1>
        <Badge variant="outline" className="mt-3 capitalize">
          {trip.status}
        </Badge>
      </header>

      {/* Section 1: Trip summary + allergies */}
      <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl text-[#1B3A4B]">{t("tripSummary")}</h2>
        <Separator />
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-neutral-500">{t("dates")}</dt>
            <dd className="mt-1 text-lg font-medium text-neutral-900">{dates}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">{t("pax")}</dt>
            <dd className="mt-1 text-lg font-medium text-neutral-900">
              {t("paxValue", {
                total: pax,
                adults: trip.adult_count,
                children: trip.child_count,
                crew: trip.crew_count,
              })}
            </dd>
          </div>
        </dl>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-700">
            {t("allergiesAndDiets")}
          </h3>
          {criticalAlerts.length === 0 && guestAlerts.length === 0 ? (
            <p className="text-base text-neutral-600">{t("noPreferenceData")}</p>
          ) : (
            <ul className="space-y-4">
              {(criticalAlerts.length > 0 ? criticalAlerts : guestAlerts).map((alert) => (
                <li
                  key={alert.guestName}
                  className="rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-800">
                    {alert.guestName}{" "}
                    <span className="font-normal normal-case text-red-700">
                      ({alert.guestType === "child" ? t("childGuest") : t("adultGuest")})
                    </span>
                  </p>
                  <p className="mt-2 text-xl font-bold leading-snug text-red-600 md:text-2xl">
                    {alert.lines.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Section 2: Menu itinerary */}
      <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl text-[#1B3A4B]">{t("menuItinerary")}</h2>
        <Separator />
        {!itinerary.length ? (
          <p className="text-neutral-600">{t("noMenu")}</p>
        ) : (
          <div className="space-y-8">
            {itinerary.map((day, index) => {
              const breakfast = mealByKey(day.meals, "breakfast");
              const lunch = mealByKey(day.meals, "lunch");
              const dinner = mealByKey(day.meals, "dinner");

              function heavinessLabel(meal: MenuMealBlock | undefined) {
                const value = meal?.heaviness?.trim();
                if (!value) return null;
                return tMenu(`heavinessOptions.${value}` as "heavinessOptions.light");
              }

              function renderMealBlock(
                title: string,
                meal: MenuMealBlock | undefined,
                dishes: Array<{ label: string; value: string | null }>
              ) {
                if (!meal) return null;
                const kids = meal.kidsMenuCount ?? 0;
                const kidsDish = resolveDishName(meal.selected_kids_dish_id, dishNames, dishPending);
                const portion = heavinessLabel(meal);

                return (
                  <div className="rounded-xl border border-neutral-100 bg-[#FAFAF8] p-4">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-semibold text-[#1B3A4B]">{title}</h4>
                      {portion ? (
                        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {tMenu("heaviness")}: {portion}
                        </span>
                      ) : null}
                    </div>
                    <ul className="space-y-1.5 text-base text-neutral-800">
                      {dishes.map((row) =>
                        row.value ? (
                          <li key={row.label}>
                            <span className="text-neutral-500">{row.label}:</span>{" "}
                            <span className="font-medium">{row.value}</span>
                          </li>
                        ) : null
                      )}
                    </ul>
                    {kids > 0 ? (
                      <p className="mt-3 border-t border-neutral-200 pt-3 text-sm font-medium text-amber-800">
                        {t("kidsMenus", { count: kids })}
                        {kidsDish ? ` — ${kidsDish}` : ""}
                      </p>
                    ) : null}
                  </div>
                );
              }

              return (
                <article key={`${day.date}-${index}`} className="space-y-4">
                  <h3 className="border-b border-[#C4A052]/30 pb-2 font-display text-xl text-[#1B3A4B]">
                    {tMenu("dayLabel", { number: index + 1, date: day.date })}
                  </h3>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {renderMealBlock(tMenu("breakfast"), breakfast, [
                      {
                        label: tMenu("breakfastDish"),
                        value: resolveDishName(breakfast?.selected_dish_id, dishNames, dishPending),
                      },
                    ])}
                    {renderMealBlock(tMenu("lunch"), lunch, [
                      {
                        label: tMenu("lunchAppetizers"),
                        value: resolveDishName(lunch?.selected_appetizer_id, dishNames, dishPending),
                      },
                      {
                        label: tMenu("lunchMains"),
                        value: resolveDishName(lunch?.selected_main_id, dishNames, dishPending),
                      },
                      {
                        label: tMenu("lunchDessert"),
                        value: resolveDishName(lunch?.selected_dessert_id, dishNames, dishPending),
                      },
                    ])}
                    {renderMealBlock(tMenu("dinner"), dinner, [
                      {
                        label: tMenu("dinnerDish"),
                        value: resolveDishName(dinner?.selected_dish_id, dishNames, dishPending),
                      },
                    ])}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Complements */}
      <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl text-[#1B3A4B]">{t("complements")}</h2>
        <Separator />

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {tSnacks("snacksToBuy")}
            </h3>
            {snackKeys.length === 0 && !otherSnack ? (
              <p className="text-neutral-600">{t("noneSelected")}</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-base text-neutral-800">
                {snackKeys
                  .filter((key) => key !== "other")
                  .map((key) => (
                    <li key={key}>{tSnacks(`items.${key}` as "items.chips")}</li>
                  ))}
                {snackKeys.includes("other") && otherSnack ? <li>{otherSnack}</li> : null}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {tSnacks("alwaysOnboard")}
            </h3>
            {alwaysKeys.length === 0 && !otherAlways ? (
              <p className="text-neutral-600">{t("noneSelected")}</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-base text-neutral-800">
                {alwaysKeys
                  .filter((key) => key !== "other")
                  .map((key) => (
                    <li key={key}>{tSnacks(`alwaysItems.${key}` as "alwaysItems.fruit")}</li>
                  ))}
                {alwaysKeys.includes("other") && otherAlways ? <li>{otherAlways}</li> : null}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {tSnacks("charcuterieSectionTitle")}
          </h3>
          {!charcuterie.meats.length &&
          !charcuterie.cheeses.length &&
          !charcuterie.complements.length ? (
            <p className="text-neutral-600">{t("noneSelected")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {charcuterie.meats.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium text-neutral-800">{tSnacks("charcuterieMeats")}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {charcuterieLabels(charcuterie.meats, "meats", charcuterie.otherMeats).map(
                      (label) => (
                        <li key={label}>{label}</li>
                      )
                    )}
                  </ul>
                </div>
              ) : null}
              {charcuterie.cheeses.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium text-neutral-800">{tSnacks("charcuterieCheeses")}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {charcuterieLabels(charcuterie.cheeses, "cheeses", charcuterie.otherCheeses).map(
                      (label) => (
                        <li key={label}>{label}</li>
                      )
                    )}
                  </ul>
                </div>
              ) : null}
              {charcuterie.complements.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium text-neutral-800">
                    {tSnacks("charcuterieComplements")}
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {charcuterieLabels(
                      charcuterie.complements,
                      "complements",
                      charcuterie.otherComplements
                    ).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {t("barBottles")}
          </h3>
          {byob ? (
            <p className="font-medium text-neutral-800">{t("byob")}</p>
          ) : null}
          {specificRequest ? (
            <p className="text-base text-neutral-800">
              <span className="font-medium">{t("specificRequest")}:</span> {specificRequest}
            </p>
          ) : null}
          {barLines.length === 0 ? (
            <p className="text-neutral-600">{t("noBarSelections")}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
              {barLines.map((line, idx) => (
                <li
                  key={`${line.category}-${line.label}-${idx}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-base"
                >
                  <span className="text-neutral-800">
                    <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      {line.category}
                    </span>
                    {line.label}
                  </span>
                  <span className="shrink-0 font-medium text-[#1B3A4B]">× {line.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
