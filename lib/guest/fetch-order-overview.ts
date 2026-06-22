import { createClient } from "@/lib/supabase/server";
import { getCrewCount } from "@/lib/pricing/crew";
import { parseMenuOrder } from "@/lib/guest/menu-itinerary";
import { collectDishIdsFromItinerary } from "@/lib/chef/collect-menu-dish-ids";
import { normalizeBarOrder } from "@/lib/trip/wizard";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import { calculateTripCostUsd } from "@/lib/pricing/calculate-trip-cost";
import { fetchPricingCatalog } from "@/lib/pricing/fetch-pricing-catalog";

export interface OrderOverviewData {
  tripId: string;
  startDate: string | null;
  endDate: string | null;
  adultCount: number;
  childCount: number;
  crewCount: number;
  status: string;
  itinerary: ReturnType<typeof parseMenuOrder>;
  dishNames: Record<string, string>;
  snacksData: Record<string, unknown>;
  barOrder: Record<string, unknown>;
  catalogNames: Record<string, string>;
  tripCostUsd: number;
}

export async function fetchOrderOverview(tripId: string): Promise<OrderOverviewData | null> {
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, adult_count, child_count, menu_order, bar_order")
    .eq("id", tripId)
    .single();

  if (!trip) return null;

  const itinerary = parseMenuOrder(trip.menu_order);
  const dishIds = collectDishIdsFromItinerary(itinerary);
  const dishNames: Record<string, string> = {};

  if (dishIds.length > 0) {
    const { data: dishes } = await supabase.from("dishes").select("id, name").in("id", dishIds);
    for (const dish of dishes ?? []) {
      dishNames[dish.id] = dish.name;
    }
  }

  const barOrder = normalizeBarOrder(trip.bar_order);
  const snacksRaw = barOrder.snacks;
  const snacksData =
    snacksRaw && typeof snacksRaw === "object" ? (snacksRaw as Record<string, unknown>) : {};

  const catalog = await fetchPricingCatalog();
  const tripCostUsd = calculateTripCostUsd({
    itinerary,
    adultCount: trip.adult_count ?? 0,
    childCount: trip.child_count ?? 0,
    barOrder,
    snacksData,
    catalog,
  });

  return {
    tripId: trip.id,
    startDate: normalizeDateOnlyInput(trip.start_date),
    endDate: normalizeDateOnlyInput(trip.end_date),
    adultCount: trip.adult_count ?? 0,
    childCount: trip.child_count ?? 0,
    crewCount: getCrewCount(trip.adult_count ?? 0, trip.child_count ?? 0),
    status: trip.status,
    itinerary,
    dishNames,
    snacksData,
    barOrder,
    tripCostUsd,
    catalogNames: catalog.namesById,
  };
}
