import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import type { ChefTripListItem } from "@/app/[locale]/(chef)/chef/chef-actions";

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

interface UpcomingTripsGridProps {
  trips: ChefTripListItem[];
  locale: string;
}

export async function UpcomingTripsGrid({ trips, locale }: UpcomingTripsGridProps) {
  const t = await getTranslations("chef.portal");

  if (!trips.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-8 py-16 text-center">
        <p className="text-lg text-neutral-600">{t("emptyTrips")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {trips.map((trip) => {
        const pax = trip.adult_count + trip.child_count;
        const dates = formatTripDates(trip.start_date, trip.end_date, locale, t("datesTbd"));

        return (
          <article
            key={trip.id}
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-[#C4A052]/40 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {t("tripId")}
                </p>
                <h2 className="font-display text-xl text-[#1B3A4B]">
                  {trip.notes?.trim() ? trip.notes.trim() : `#${shortTripId(trip.id)}`}
                </h2>
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
      })}
    </div>
  );
}
