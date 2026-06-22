"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isChefRole } from "@/lib/auth/roles";
import { collectDishIdsFromItinerary } from "@/lib/chef/collect-menu-dish-ids";
import { parseMenuOrder, type MenuDayPlan } from "@/lib/guest/menu-itinerary";
import { areTripDatesValid, normalizeDateOnlyInput } from "@/lib/trip/date-validation";
import { normalizeBarOrder } from "@/lib/trip/wizard";
import { calculateTripCostUsd } from "@/lib/pricing/calculate-trip-cost";
import { fetchPricingCatalog, type PricingCatalog } from "@/lib/pricing/fetch-pricing-catalog";
import type { GuestPreferences, Trip } from "@/lib/types/database";

const CHEF_VISIBLE_STATUSES: Trip["status"][] = ["submitted", "active", "completed", "settled"];

export interface ChefTripListItem {
  id: string;
  status: Trip["status"];
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  crew_count: number;
  notes: string | null;
  principal_guest_name: string;
}

export interface ChefTripParticipant {
  id: string;
  display_name: string;
  participant_type: string;
  sort_order: number;
  guest_preferences: GuestPreferences | null;
}

export interface ChefTripDetailsPayload {
  trip: Pick<
    Trip,
    | "id"
    | "status"
    | "start_date"
    | "end_date"
    | "adult_count"
    | "child_count"
    | "crew_count"
    | "notes"
    | "menu_order"
    | "bar_order"
    | "global_meal_schedule"
  >;
  principal_guest_name: string;
  participants: ChefTripParticipant[];
  itinerary: MenuDayPlan[];
  dishNames: Record<string, string>;
  barOrder: Record<string, unknown>;
  snacksData: Record<string, unknown>;
  tripCostUsd: number;
  pricingCatalog: PricingCatalog;
}

async function assertChefAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = await resolveUserRole(supabase, user);
  if (!isChefRole(role)) throw new Error("Forbidden");

  return supabase;
}

function resolvePrincipalGuestName(
  profile: { full_name: string | null } | { full_name: string | null }[] | null
): string {
  const row = Array.isArray(profile) ? profile[0] : profile;
  const name = row?.full_name?.trim();
  return name || "—";
}

export async function getUpcomingTrips(): Promise<ChefTripListItem[]> {
  const supabase = await assertChefAccess();

  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, status, start_date, end_date, adult_count, child_count, crew_count, notes, profiles:created_by ( full_name )"
    )
    .in("status", CHEF_VISIBLE_STATUSES)
    .not("start_date", "is", null)
    .not("end_date", "is", null)
    .order("start_date", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((trip) =>
      areTripDatesValid(
        normalizeDateOnlyInput(trip.start_date),
        normalizeDateOnlyInput(trip.end_date)
      )
    )
    .map((trip) => ({
      id: trip.id as string,
      status: trip.status as Trip["status"],
      start_date: trip.start_date as string | null,
      end_date: trip.end_date as string | null,
      adult_count: trip.adult_count as number,
      child_count: trip.child_count as number,
      crew_count: trip.crew_count as number,
      notes: trip.notes as string | null,
      principal_guest_name: resolvePrincipalGuestName(
        trip.profiles as { full_name: string | null } | { full_name: string | null }[] | null
      ),
    }));
}

export async function getTripDetails(tripId: string): Promise<ChefTripDetailsPayload | null> {
  const supabase = await assertChefAccess();

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, status, start_date, end_date, adult_count, child_count, crew_count, notes, menu_order, bar_order, global_meal_schedule, profiles:created_by ( full_name )"
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error) throw error;
  if (!trip) return null;

  const { data: participantRows, error: participantsError } = await supabase
    .from("trip_participants")
    .select(
      "id, display_name, participant_type, sort_order, guest_preferences (*)"
    )
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  if (participantsError) throw participantsError;

  const participants: ChefTripParticipant[] = (participantRows ?? []).map((row) => {
    const rawPrefs = row.guest_preferences;
    const guest_preferences = Array.isArray(rawPrefs)
      ? ((rawPrefs[0] as GuestPreferences | undefined) ?? null)
      : ((rawPrefs as GuestPreferences | null) ?? null);

    return {
      id: row.id as string,
      display_name: row.display_name as string,
      participant_type: row.participant_type as string,
      sort_order: row.sort_order as number,
      guest_preferences,
    };
  });

  const itinerary = parseMenuOrder(trip.menu_order);
  const dishIds = collectDishIdsFromItinerary(itinerary);
  const dishNames: Record<string, string> = {};

  if (dishIds.length > 0) {
    const { data: dishes, error: dishesError } = await supabase
      .from("dishes")
      .select("id, name")
      .in("id", dishIds);

    if (dishesError) throw dishesError;

    for (const dish of dishes ?? []) {
      dishNames[dish.id] = dish.name;
    }
  }

  const barOrder = normalizeBarOrder(trip.bar_order);
  const snacksRaw = barOrder.snacks;
  const snacksData =
    snacksRaw && typeof snacksRaw === "object" && !Array.isArray(snacksRaw)
      ? (snacksRaw as Record<string, unknown>)
      : {};

  const pricingCatalog = await fetchPricingCatalog();
  const tripCostUsd = calculateTripCostUsd({
    itinerary,
    adultCount: trip.adult_count ?? 0,
    childCount: trip.child_count ?? 0,
    barOrder,
    snacksData,
    catalog: pricingCatalog,
  });

  return {
    trip: trip as ChefTripDetailsPayload["trip"],
    principal_guest_name: resolvePrincipalGuestName(
      trip.profiles as { full_name: string | null } | { full_name: string | null }[] | null
    ),
    participants,
    itinerary,
    dishNames,
    barOrder,
    snacksData,
    tripCostUsd,
    pricingCatalog,
  };
}
