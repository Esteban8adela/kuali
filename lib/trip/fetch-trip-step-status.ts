import { createClient } from "@/lib/supabase/server";
import { computeTripStepStatus, type StepStatus } from "@/lib/trip/step-status";

export type { StepState, StepStatus } from "@/lib/trip/step-status";

export async function fetchTripStepStatus(
  tripId: string,
  locale: string
): Promise<StepStatus> {
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("start_date, end_date, adult_count, child_count, wizard_step, status, bar_order, menu_order")
    .eq("id", tripId)
    .single();

  if (!trip) {
    return {
      step1: "none",
      step2: "none",
      step3: "none",
      step4: "none",
      step5: "none",
    };
  }

  const { data: participants } = await supabase
    .from("trip_participants")
    .select("id, guest_preferences(id, no_dietary_restrictions, allergies, dietary_restrictions)")
    .eq("trip_id", tripId);

  const { data: selection } = await supabase
    .from("trip_menu_selections")
    .select("selection_type, custom_notes")
    .eq("trip_id", tripId)
    .limit(1)
    .single();

  return computeTripStepStatus(trip, participants ?? [], selection, locale);
}
