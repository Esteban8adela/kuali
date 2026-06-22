import { normalizeDateOnlyInput, parseDateOnlyMs } from "@/lib/trip/date-validation";
import type { ChefTripListItem } from "@/app/[locale]/(chef)/chef/chef-actions";

export type ChefTripCategory = "present" | "future" | "past";

export interface CategorizedChefTrips {
  present: ChefTripListItem[];
  future: ChefTripListItem[];
  past: ChefTripListItem[];
}

function todayMs(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0).getTime();
}

export function categorizeChefTrips(trips: ChefTripListItem[]): CategorizedChefTrips {
  const today = todayMs();
  const present: ChefTripListItem[] = [];
  const future: ChefTripListItem[] = [];
  const past: ChefTripListItem[] = [];

  for (const trip of trips) {
    const startMs = parseDateOnlyMs(normalizeDateOnlyInput(trip.start_date));
    const endMs = parseDateOnlyMs(normalizeDateOnlyInput(trip.end_date));
    if (startMs === null || endMs === null) continue;

    if (startMs <= today && today <= endMs) {
      present.push(trip);
    } else if (startMs > today) {
      future.push(trip);
    } else if (endMs < today) {
      past.push(trip);
    }
  }

  return { present, future, past };
}
