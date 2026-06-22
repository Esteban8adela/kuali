"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import type { ChefTripListItem } from "@/app/[locale]/(chef)/chef/chef-actions";
import type { CategorizedChefTrips } from "@/lib/chef/categorize-trips";

function formatTripDates(
  start: string | null,
  end: string | null,
  locale: string,
  tbd: string
): string {
  const startNorm = normalizeDateOnlyInput(start);
  const endNorm = normalizeDateOnlyInput(end);
  if (!startNorm && !endNorm) return tbd;
  if (startNorm && endNorm) {
    const fmt = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
    });
    return `${fmt.format(new Date(`${startNorm}T12:00:00`))} → ${fmt.format(new Date(`${endNorm}T12:00:00`))}`;
  }
  return startNorm ?? endNorm ?? tbd;
}

function shortTripId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function TripCard({ trip, locale }: { trip: ChefTripListItem; locale: string }) {
  const t = useTranslations("chef.portal");
  const pax = trip.adult_count + trip.child_count;
  const dates = formatTripDates(trip.start_date, trip.end_date, locale, t("datesTbd"));

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-[#C4A052]/40 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-[#1B3A4B]">
            {t("tripOfGuest", { name: trip.principal_guest_name })}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {t("tripRef", { id: shortTripId(trip.id) })}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 capitalize">
          {trip.status}
        </Badge>
      </div>

      <dl className="mb-6 space-y-3 text-sm">
        <div>
          <dt className="text-neutral-500">{t("dates")}</dt>
          <dd className="font-medium text-neutral-900">{dates}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t("passengers")}</dt>
          <dd className="font-medium text-neutral-900">
            {t("passengersValue", {
              total: pax,
              adults: trip.adult_count,
              children: trip.child_count,
              crew: trip.crew_count,
            })}
          </dd>
        </div>
      </dl>

      <div className="mt-auto">
        <Button asChild className="w-full bg-[#1B3A4B] hover:bg-[#1B3A4B]/90">
          <Link href={`/${locale}/chef/trip/${trip.id}`}>{t("viewServiceOrder")}</Link>
        </Button>
      </div>
    </article>
  );
}

function TripGrid({ trips, locale }: { trips: ChefTripListItem[]; locale: string }) {
  const t = useTranslations("chef.portal");

  if (!trips.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-8 py-12 text-center">
        <p className="text-neutral-600">{t("emptyCategory")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} locale={locale} />
      ))}
    </div>
  );
}

interface ChefTripsBoardProps {
  categorized: CategorizedChefTrips;
  locale: string;
  defaultTab?: "present" | "future" | "past";
  hideTabs?: boolean;
}

export function ChefTripsBoard({
  categorized,
  locale,
  defaultTab: defaultTabProp,
  hideTabs = false,
}: ChefTripsBoardProps) {
  const t = useTranslations("chef.portal");
  const total =
    categorized.present.length + categorized.future.length + categorized.past.length;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-8 py-16 text-center">
        <p className="text-lg text-neutral-600">{t("emptyTrips")}</p>
      </div>
    );
  }

  const defaultTab =
    defaultTabProp ??
    (categorized.present.length
      ? "present"
      : categorized.future.length
        ? "future"
        : "past");

  if (hideTabs) {
    const trips =
      defaultTab === "present"
        ? categorized.present
        : defaultTab === "future"
          ? categorized.future
          : categorized.past;
    return <TripGrid trips={trips} locale={locale} />;
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="h-auto flex-wrap gap-1 bg-neutral-100 p-1">
        <TabsTrigger value="present" className="gap-2">
          {t("tabPresent")}
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs">
            {categorized.present.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="future" className="gap-2">
          {t("tabFuture")}
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs">
            {categorized.future.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="past" className="gap-2">
          {t("tabPast")}
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs">
            {categorized.past.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="present" className="mt-0">
        <TripGrid trips={categorized.present} locale={locale} />
      </TabsContent>
      <TabsContent value="future" className="mt-0">
        <TripGrid trips={categorized.future} locale={locale} />
      </TabsContent>
      <TabsContent value="past" className="mt-0">
        <TripGrid trips={categorized.past} locale={locale} />
      </TabsContent>
    </Tabs>
  );
}
