"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isChefRole } from "@/lib/auth/roles";
import { collectDishIdsFromItinerary } from "@/lib/chef/collect-menu-dish-ids";
import { parseMenuOrder, type MenuDayPlan } from "@/lib/guest/menu-itinerary";
import { normalizeBarOrder } from "@/lib/trip/wizard";
import type { GuestPreferences, Trip } from "@/lib/types/database";

export interface ChefTripListItem {
  id: string;
  status: Trip["status"];
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  crew_count: number;
  notes: string | null;
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
  participants: ChefTripParticipant[];
  itinerary: MenuDayPlan[];
  dishNames: Record<string, string>;
  barOrder: Record<string, unknown>;
  snacksData: Record<string, unknown>;
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

export async function getUpcomingTrips(): Promise<ChefTripListItem[]> {
  const supabase = await assertChefAccess();

  const { data, error } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, adult_count, child_count, crew_count, notes")
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as ChefTripListItem[];
}

export async function getTripDetails(tripId: string): Promise<ChefTripDetailsPayload | null> {
  const supabase = await assertChefAccess();

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, status, start_date, end_date, adult_count, child_count, crew_count, notes, menu_order, bar_order, global_meal_schedule"
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

  return {
    trip: trip as ChefTripDetailsPayload["trip"],
    participants,
    itinerary,
    dishNames,
    barOrder,
    snacksData,
  };
}
