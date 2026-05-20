"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { useTripRealtime } from "@/hooks/use-trip-realtime";
import type { GuestPreferences } from "@/lib/types/database";

interface LiveOrdersPanelProps {
  tripId: string;
}

export function LiveOrdersPanel({ tripId }: LiveOrdersPanelProps) {
  const t = useTranslations("chef");
  const { trip, preferences } = useTripRealtime(tripId);

  const critical = preferences.filter((p) => p.allergies?.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-[#1B3A4B]">{t("orders")}</h2>
        {trip && (
          <Badge variant="gold">
            {trip.adult_count + trip.child_count} guests · crew {trip.crew_count}
          </Badge>
        )}
      </div>

      {critical.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-600">
            {t("allergies")}
          </h3>
          <ul className="space-y-2">
            {critical.map((p: GuestPreferences) => (
              <li key={p.id} className="allergy-critical rounded-lg px-4 py-3 text-sm font-medium">
                {p.allergies.join(" · ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {preferences.map((p) => {
          const schedule = p.meal_schedule as Record<
            string,
            { time?: string; heaviness?: string }
          >;
          return (
            <div key={p.id} className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs uppercase text-neutral-400">Guest preferences</p>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(schedule).map(([meal, cfg]) => (
                  <li key={meal}>
                    <span className="capitalize text-[#1B3A4B]">{meal}</span>:{" "}
                    {cfg?.time ?? "—"} · {cfg?.heaviness ?? "—"}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
