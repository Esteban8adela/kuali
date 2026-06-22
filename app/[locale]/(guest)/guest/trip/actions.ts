"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  tripDetailsSchema,
  menuSelectionSchema,
  guestPreferencesSchema,
  globalMealScheduleSchema,
  finalizeTripSchema,
} from "@/lib/validations/guest-wizard";
import { calculateMealCostWithCrew } from "@/lib/pricing/calculate-trip-total";
import { clampWizardStep, normalizeBarOrder } from "@/lib/trip/wizard";
import { coerceToDateOnlyString } from "@/lib/trip/date-validation";
import { genericStoredName } from "@/lib/guest/participant-names";
import {
  hasCharcuterieSelections,
  type CharcuterieSelections,
} from "@/lib/guest/charcuterie-selections";

export async function createTrip(locale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("trips")
    .insert({
      created_by: user.id,
      locale,
      status: "draft",
      adult_count: 2,
      child_count: 0,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function updateTripDetails(input: unknown) {
  const parsed = tripDetailsSchema.parse(input);
  const supabase = await createClient();

  const startDate: string | null = coerceToDateOnlyString(parsed.startDate);
  const endDate: string | null = coerceToDateOnlyString(parsed.endDate);

  const { error } = await supabase
    .from("trips")
    .update({
      adult_count: parsed.adultCount,
      child_count: parsed.childCount,
      start_date: startDate,
      end_date: endDate,
      wizard_step: clampWizardStep(parsed.wizardStep ?? 1),
    })
    .eq("id", parsed.tripId);

  if (error) throw error;

  if (parsed.adultNames || parsed.childNames) {
    await syncTripParticipants(parsed.tripId, parsed.adultCount, parsed.childCount, {
      adultNames: parsed.adultNames ?? [],
      childNames: parsed.childNames ?? [],
    });
  }

  revalidatePath(`/`, "layout");
  return { ok: true };
}

export async function saveMenuSelection(input: unknown) {
  const parsed = menuSelectionSchema.parse(input);
  const supabase = await createClient();

  const menuOrder = { itinerary: parsed.itinerary };

  const { error: tripError } = await supabase
    .from("trips")
    .update({ menu_order: menuOrder, wizard_step: 2 })
    .eq("id", parsed.tripId);

  if (tripError) throw tripError;

  await supabase.from("trip_menu_selections").delete().eq("trip_id", parsed.tripId);

  const { error: selectionError } = await supabase.from("trip_menu_selections").insert({
    trip_id: parsed.tripId,
    menu_id: null,
    selection_type: parsed.selectionType,
    custom_notes: JSON.stringify(menuOrder),
    quantity_adult: 1,
  });

  if (selectionError) throw selectionError;

  revalidatePath(`/`, "layout");
  return { ok: true };
}

export async function syncTripParticipants(
  tripId: string,
  adults: number,
  children: number,
  names?: { adultNames: string[]; childNames: string[] }
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("trip_participants")
    .select("id, participant_type, sort_order, display_name")
    .eq("trip_id", tripId)
    .order("sort_order");

  const current = existing ?? [];
  const slots: { type: "adult" | "child"; name: string; index: number }[] = [
    ...Array.from({ length: adults }, (_, i) => ({
      type: "adult" as const,
      name: names?.adultNames[i]?.trim() || genericStoredName("adult", i + 1),
      index: i,
    })),
    ...Array.from({ length: children }, (_, i) => ({
      type: "child" as const,
      name: names?.childNames[i]?.trim() || genericStoredName("child", i + 1),
      index: adults + i,
    })),
  ];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (current[i]) {
      await supabase
        .from("trip_participants")
        .update({
          participant_type: slot.type,
          display_name: slot.name,
          sort_order: i,
        })
        .eq("id", current[i].id);
    } else {
      const { data: p } = await supabase
        .from("trip_participants")
        .insert({
          trip_id: tripId,
          participant_type: slot.type,
          display_name: slot.name,
          sort_order: i,
        })
        .select("id")
        .single();

      if (p) {
        await supabase.from("guest_preferences").insert({ participant_id: p.id });
      }
    }
  }

  if (current.length > slots.length) {
    const toRemove = current.slice(slots.length).map((p) => p.id);
    await supabase.from("trip_participants").delete().in("id", toRemove);
  }
}

export async function saveGuestPreferences(input: unknown) {
  const parsed = guestPreferencesSchema.parse(input);
  const supabase = await createClient();

  const allergyList = [...parsed.allergies];
  if (parsed.allergiesOther?.trim()) {
    allergyList.push(`other:${parsed.allergiesOther.trim()}`);
  }

  const { error } = await supabase
    .from("guest_preferences")
    .upsert({
      participant_id: parsed.participantId,
      no_dietary_restrictions: parsed.noDietaryRestrictions,
      allergies: allergyList,
      dietary_restrictions: parsed.dietaryRestrictions,
      protein_preferences: parsed.proteinPreferences,
      general_food_notes: parsed.generalFoodNotes ?? [],
      dairy_preferences: parsed.dairyPreferences ?? [],
    }, { onConflict: "participant_id" });

  if (error) throw error;
  return { ok: true };
}

export async function saveAllGuestPreferences(inputs: unknown[]) {
  for (const input of inputs) {
    await saveGuestPreferences(input);
  }
  return { ok: true };
}

export async function saveGlobalMealSchedule(input: unknown) {
  const parsed = globalMealScheduleSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("trips")
    .update({
      global_meal_schedule: parsed.mealSchedule,
      wizard_step: 3,
    })
    .eq("id", parsed.tripId);

  if (error) throw error;
  return { ok: true };
}

export async function saveSnacksStep(input: {
  tripId: string;
  snacks: string[];
  alwaysOnboard: string[];
  charcuterieSelections: CharcuterieSelections;
  otherSnack?: string | null;
  otherAlways?: string | null;
}) {
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("bar_order")
    .eq("id", input.tripId)
    .single();

  const nextBar = {
    ...normalizeBarOrder(trip?.bar_order),
    snacks: {
      snacks: input.snacks,
      alwaysOnboard: input.alwaysOnboard,
      charcuterie_selections: input.charcuterieSelections,
      crudites: hasCharcuterieSelections(input.charcuterieSelections),
      otherSnack: input.otherSnack ?? null,
      otherAlways: input.otherAlways ?? null,
    },
  };

  const { error } = await supabase
    .from("trips")
    .update({ bar_order: nextBar, wizard_step: clampWizardStep(4) })
    .eq("id", input.tripId);

  if (error) throw error;
  return { ok: true };
}

export async function saveBarStep(input: {
  tripId: string;
  barOrder: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("bar_order")
    .eq("id", input.tripId)
    .single();

  const mergedBarOrder = {
    ...normalizeBarOrder(trip?.bar_order),
    ...normalizeBarOrder(input.barOrder),
    bar_saved: true,
  };

  const { error } = await supabase
    .from("trips")
    .update({
      bar_order: mergedBarOrder,
      wizard_step: clampWizardStep(5),
    })
    .eq("id", input.tripId);

  if (error) throw error;
  revalidatePath(`/`, "layout");
  return { ok: true };
}

/** Persists full bar order on `trips.bar_order` and marks trip submitted */
export async function finalizeTripBooking(input: unknown) {
  const parsed = finalizeTripSchema.parse(input);
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("adult_count, child_count, bar_order")
    .eq("id", parsed.tripId)
    .single();

  const mergedBarOrder = {
    ...normalizeBarOrder(trip?.bar_order),
    ...normalizeBarOrder(parsed.barOrder),
    bar_saved: true,
  };

  const dishLines = Object.keys(mergedBarOrder).length;
  const estimatedTotalCents = calculateMealCostWithCrew({
    adults: trip?.adult_count ?? 0,
    children: trip?.child_count ?? 0,
    perPlateCostCents: Math.max(0, dishLines) * 100,
  });

  const { error } = await supabase
    .from("trips")
    .update({
      bar_order: mergedBarOrder,
      status: "submitted",
      wizard_step: clampWizardStep(5),
      estimated_total_cents: estimatedTotalCents,
    })
    .eq("id", parsed.tripId);

  if (error) throw error;
  revalidatePath(`/`, "layout");
  return { ok: true };
}

export async function advanceWizardStep(tripId: string, step: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .update({ wizard_step: clampWizardStep(step) })
    .eq("id", tripId);
  if (error) throw error;
  return { ok: true };
}

export async function saveDraftAndExit(tripId: string) {
  const supabase = await createClient();
  await supabase
    .from("trips")
    .update({ status: "draft" })
    .eq("id", tripId);
  revalidatePath(`/`, "layout");
  return { ok: true };
}
