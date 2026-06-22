import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GenerateShoppingListButton } from "@/components/chef/generate-shopping-list-button";
import { formatChefGuestDisplayName, participantGuestNumber } from "@/lib/guest/participant-names";
import { parseAllergiesFromDb } from "@/lib/guest/preference-state";
import {
  extractBarBottleLines,
} from "@/lib/chef/format-service-order";
import { resolveBarLineLabel, resolveSnacksSelectionLabels } from "@/lib/chef/resolve-catalog-labels";
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

interface GuestPreferenceCard {
  guestName: string;
  guestType: string;
  allergies: string[];
  dietStyle: string | null;
  comments: string | null;
  requiresAttention: boolean;
}

function buildGuestPreferenceCards(
  participants: ChefTripParticipant[],
  allergyLabel: (key: string) => string,
  dietLabel: (key: string) => string,
  locale: string
): GuestPreferenceCard[] {
  return participants.map((participant) => {
    const prefs = participant.guest_preferences;
    const allergies: string[] = [];

    if (prefs && !prefs.no_dietary_restrictions) {
      const { allergies: allergyKeys, allergiesOther } = parseAllergiesFromDb(prefs.allergies ?? []);
      for (const allergy of allergyKeys) {
        if (allergy === "other") {
          if (allergiesOther.trim()) allergies.push(allergiesOther.trim());
        } else {
          allergies.push(allergyLabel(allergy));
        }
      }
    }

    const dietKey = prefs?.dietary_restrictions?.[0]?.trim();
    const dietStyle = dietKey ? dietLabel(dietKey) : null;

    const comments = prefs?.general_food_notes?.[0]?.trim() || null;
    const requiresAttention =
      allergies.length > 0 || Boolean(dietStyle) || Boolean(comments);

    const guestType = participant.participant_type as "adult" | "child";
    const guestNumber = participantGuestNumber(participants, participant.id, guestType);

    return {
      guestName: formatChefGuestDisplayName(
        participant.display_name,
        guestType,
        guestNumber,
        locale
      ),
      guestType: participant.participant_type,
      allergies,
      dietStyle,
      comments,
      requiresAttention,
    };
  });
}

function GuestAttentionCard({
  guest,
  t,
}: {
  guest: GuestPreferenceCard;
  t: Awaited<ReturnType<typeof getTranslations<"chef.serviceOrder">>>;
}) {
  const hasAllergies = guest.allergies.length > 0;

  return (
    <li className="rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-800">
        {guest.guestName}{" "}
        <span className="font-normal normal-case text-red-700">
          ({guest.guestType === "child" ? t("childGuest") : t("adultGuest")})
        </span>
      </p>
      <ul className="mt-3 space-y-2 text-base">
        <li>
          <span className="font-semibold text-neutral-800">{t("allergiesLabel")}: </span>
          <span
            className={
              hasAllergies ? "text-lg font-bold text-red-600 md:text-xl" : "text-neutral-600"
            }
          >
            {hasAllergies ? guest.allergies.join(", ") : t("noAllergies")}
          </span>
        </li>
        {guest.dietStyle ? (
          <li>
            <span className="font-semibold text-neutral-800">{t("dietStyleLabel")}: </span>
            <span className="font-medium text-neutral-900">{guest.dietStyle}</span>
          </li>
        ) : null}
        {guest.comments ? (
          <li>
            <span className="font-semibold text-neutral-700">{t("commentsLabel")}: </span>
            <span className="text-neutral-600">{guest.comments}</span>
          </li>
        ) : null}
      </ul>
    </li>
  );
}

function GuestNoRestrictionsCard({
  guest,
  t,
}: {
  guest: GuestPreferenceCard;
  t: Awaited<ReturnType<typeof getTranslations<"chef.serviceOrder">>>;
}) {
  return (
    <li className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-green-800">
      <p className="text-sm font-semibold text-green-900">
        {guest.guestName}{" "}
        <span className="font-normal text-green-700">
          ({guest.guestType === "child" ? t("childGuest") : t("adultGuest")})
        </span>
      </p>
      <p className="mt-1 text-sm font-medium">{t("noDietaryRestrictionsLegend")}</p>
    </li>
  );
}

interface ServiceOrderReportProps {
  data: ChefTripDetailsPayload;
  locale: string;
}

export async function ServiceOrderReport({ data, locale }: ServiceOrderReportProps) {
  const t = await getTranslations("chef.serviceOrder");
  const tCategories = await getTranslations("catalogCategories");
  const tAllergies = await getTranslations("guest.wizard.preferences.allergyOptions");
  const tDiet = await getTranslations("guest.wizard.preferences.dietStyles");
  const tMenu = await getTranslations("guest.wizard.menu");

  const {
    trip,
    principal_guest_name,
    participants,
    itinerary,
    dishNames,
    barOrder,
    snacksData,
    pricingCatalog,
  } = data;
  const pax = trip.adult_count + trip.child_count;
  const dates = formatDateRange(trip.start_date, trip.end_date, locale, t("datesTbd"));
  const allGuestPreferences = buildGuestPreferenceCards(
    participants,
    (key) => tAllergies(key as "gluten"),
    (key) => tDiet(key as "vegan"),
    locale
  );
  const attentionGuests = allGuestPreferences.filter((guest) => guest.requiresAttention);
  const unrestrictedGuests = allGuestPreferences.filter((guest) => !guest.requiresAttention);

  const snackLabels = resolveSnacksSelectionLabels(snacksData, pricingCatalog);
  const barLines = extractBarBottleLines(barOrder).map((line) => ({
    ...line,
    displayLabel: resolveBarLineLabel(line, pricingCatalog.namesById),
    categoryLabel: tCategories.has(line.category as "rum")
      ? tCategories(line.category as "rum")
      : line.category,
  }));
  const byob = Boolean(barOrder.byob);
  const specificRequest =
    typeof barOrder.specific_bottle_request === "string" ? barOrder.specific_bottle_request.trim() : "";

  const dishPending = t("dishPending");

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
        <GenerateShoppingListButton
          label={t("generateShoppingList")}
          tripId={trip.id}
          locale={locale}
        />
      </div>

      <header className="rounded-2xl border border-[#1B3A4B]/15 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C4A052]">
          {t("serviceOrder")}
        </p>
        <h1 className="mt-2 font-display text-3xl text-[#1B3A4B] md:text-4xl">
          {t("tripOfGuest", { name: principal_guest_name })}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {t("tripRef", { id: trip.id.slice(0, 8).toUpperCase() })}
        </p>
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

        <div className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1B3A4B]">
            {t("dietaryProfilesTitle")}
          </h3>
          {!allGuestPreferences.length ? (
            <p className="text-base text-neutral-600">{t("noPreferenceData")}</p>
          ) : (
            <>
              {attentionGuests.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                    {t("requiresAttentionGroup")}
                  </p>
                  <ul className="space-y-4">
                    {attentionGuests.map((guest) => (
                      <GuestAttentionCard key={guest.guestName} guest={guest} t={t} />
                    ))}
                  </ul>
                </div>
              ) : null}
              {unrestrictedGuests.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
                    {t("noRestrictionsGroup")}
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {unrestrictedGuests.map((guest) => (
                      <GuestNoRestrictionsCard key={guest.guestName} guest={guest} t={t} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
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
                      <div className="mt-3 border-t border-neutral-200 pt-3">
                        <p className="text-sm font-semibold text-amber-900">
                          {tMenu("kidsMenuDish")}
                          <span className="ml-1 font-normal text-amber-800">
                            ({t("kidsMenus", { count: kids })})
                          </span>
                        </p>
                        <p className="mt-1 text-base font-medium text-neutral-900">
                          {kidsDish ?? dishPending}
                        </p>
                      </div>
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
              {t("snacksToBuy")}
            </h3>
            {snackLabels.snacks.length === 0 ? (
              <p className="text-neutral-600">{t("noneSelected")}</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-base text-neutral-800">
                {snackLabels.snacks.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {t("alwaysOnboard")}
            </h3>
            {snackLabels.alwaysOnboard.length === 0 ? (
              <p className="text-neutral-600">{t("noneSelected")}</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-base text-neutral-800">
                {snackLabels.alwaysOnboard.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {t("charcuterieSection")}
          </h3>
          {!snackLabels.charcuterie.meats.length &&
          !snackLabels.charcuterie.cheeses.length &&
          !snackLabels.charcuterie.complements.length ? (
            <p className="text-neutral-600">{t("noneSelected")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {snackLabels.charcuterie.meats.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium text-neutral-800">{t("charcuterieMeats")}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {snackLabels.charcuterie.meats.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {snackLabels.charcuterie.cheeses.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium text-neutral-800">{t("charcuterieCheeses")}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {snackLabels.charcuterie.cheeses.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {snackLabels.charcuterie.complements.length > 0 ? (
                <div>
                  <p className="mb-2 font-medium text-neutral-800">{t("charcuterieComplements")}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                    {snackLabels.charcuterie.complements.map((label) => (
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
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-100 p-4">
              <p className="text-sm font-medium text-gray-600">{t("specificRequest")}</p>
              <p className="mt-1 text-base font-medium italic text-gray-800">{specificRequest}</p>
            </div>
          ) : null}
          {barLines.length === 0 ? (
            <p className="text-neutral-600">{t("noBarSelections")}</p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
              {barLines.map((line, idx) => (
                <li
                  key={`${line.category}-${line.displayLabel}-${idx}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-base"
                >
                  <span className="text-neutral-800">
                    <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      {line.categoryLabel}
                    </span>
                    {line.displayLabel}
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
