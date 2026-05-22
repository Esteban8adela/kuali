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

  const { error } = await supabase
    .from("trips")
    .update({
      adult_count: parsed.adultCount,
      child_count: parsed.childCount,
      start_date: parsed.startDate || null,
      end_date: parsed.endDate || null,
      wizard_step: parsed.wizardStep ?? 1,
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

  await supabase.from("trip_menu_selections").delete().eq("trip_id", parsed.tripId);

  const { error } = await supabase.from("trip_menu_selections").insert({
    trip_id: parsed.tripId,
    menu_id: parsed.menuId,
    selection_type: parsed.selectionType,
    custom_notes: parsed.customNotes,
    quantity_adult: 1,
  });

  if (error) throw error;

  await supabase.from("trips").update({ wizard_step: 2 }).eq("id", parsed.tripId);
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
      name: names?.adultNames[i]?.trim() || `Guest ${i + 1}`,
      index: i,
    })),
    ...Array.from({ length: children }, (_, i) => ({
      type: "child" as const,
      name: names?.childNames[i]?.trim() || `Child ${i + 1}`,
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
    .update({
      allergies: allergyList,
      dietary_restrictions: parsed.dietaryRestrictions,
      protein_preferences: parsed.proteinPreferences,
      dairy_preferences: parsed.dairyPreferences ?? [],
    })
    .eq("participant_id", parsed.participantId);

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

/** Persists full bar order on `trips.bar_order` and marks trip submitted */
export async function finalizeTripBooking(input: unknown) {
  const parsed = finalizeTripSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("trips")
    .update({
      bar_order: parsed.barOrder,
      status: "submitted",
      wizard_step: 4,
    })
    .eq("id", parsed.tripId);

  if (error) throw error;
  revalidatePath(`/`, "layout");
  return { ok: true };
}

export async function advanceWizardStep(tripId: string, step: number) {
  const supabase = await createClient();
  await supabase.from("trips").update({ wizard_step: step }).eq("id", tripId);
  return { ok: true };
}
