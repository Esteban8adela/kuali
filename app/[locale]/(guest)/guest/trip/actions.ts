"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  tripDetailsSchema,
  menuSelectionSchema,
  guestPreferencesSchema,
  barPreferencesSchema,
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

export async function syncTripParticipants(tripId: string, adults: number, children: number) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("trip_participants")
    .select("id, participant_type, sort_order")
    .eq("trip_id", tripId)
    .order("sort_order");

  const current = existing ?? [];
  const needed: { type: "adult" | "child"; index: number }[] = [
    ...Array.from({ length: adults }, (_, i) => ({ type: "adult" as const, index: i })),
    ...Array.from({ length: children }, (_, i) => ({ type: "child" as const, index: i })),
  ];

  for (let i = 0; i < needed.length; i++) {
    const n = needed[i];
    if (current[i]) {
      await supabase
        .from("trip_participants")
        .update({
          participant_type: n.type,
          display_name:
            n.type === "adult" ? `Guest ${i + 1}` : `Child ${i - adults + 1}`,
        })
        .eq("id", current[i].id);
    } else {
      const { data: p } = await supabase
        .from("trip_participants")
        .insert({
          trip_id: tripId,
          participant_type: n.type,
          display_name:
            n.type === "adult" ? `Guest ${i + 1}` : `Child ${i - adults + 1}`,
          sort_order: i,
        })
        .select("id")
        .single();

      if (p) {
        await supabase.from("guest_preferences").insert({ participant_id: p.id });
      }
    }
  }

  if (current.length > needed.length) {
    const toRemove = current.slice(needed.length).map((p) => p.id);
    await supabase.from("trip_participants").delete().in("id", toRemove);
  }
}

export async function saveGuestPreferences(input: unknown) {
  const parsed = guestPreferencesSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_preferences")
    .update({
      allergies: parsed.allergies,
      dietary_restrictions: parsed.dietaryRestrictions,
      protein_preferences: parsed.proteinPreferences,
      dairy_preferences: parsed.dairyPreferences,
      meal_schedule: parsed.mealSchedule,
    })
    .eq("participant_id", parsed.participantId);

  if (error) throw error;
  return { ok: true };
}

export async function saveBarPreferences(input: unknown) {
  const parsed = barPreferencesSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_preferences")
    .update({ bar_preferences: parsed.barPreferences })
    .eq("participant_id", parsed.participantId);

  if (error) throw error;
  return { ok: true };
}

export async function advanceWizardStep(tripId: string, step: number) {
  const supabase = await createClient();
  await supabase.from("trips").update({ wizard_step: step }).eq("id", tripId);
  return { ok: true };
}
