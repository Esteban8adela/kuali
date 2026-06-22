import { createClient } from "@/lib/supabase/server";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { GuestDashboardView } from "@/components/guest/guest-dashboard-view";
import { computeTripStepStatus, type StepStatus } from "@/lib/trip/step-status";

export type { StepState, StepStatus } from "@/lib/trip/step-status";

const ACTIVE_TRIP_STATUSES = ["draft", "submitted", "active"] as const;

export default async function GuestDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const tripSelect =
    "id, status, start_date, end_date, adult_count, child_count, wizard_step, bar_order, menu_order";

  const { data: activeTrips } = await supabase
    .from("trips")
    .select(tripSelect)
    .eq("created_by", user.id)
    .in("status", [...ACTIVE_TRIP_STATUSES])
    .order("updated_at", { ascending: false })
    .limit(1);

  let activeTrip = activeTrips?.[0] ?? null;

  if (!activeTrip) {
    const { data: fallbackTrips } = await supabase
      .from("trips")
      .select(tripSelect)
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    activeTrip = fallbackTrips?.[0] ?? null;
  }

  let menuName: string | null = null;
  let stepStatus: StepStatus = {
    step1: "none",
    step2: "none",
    step3: "none",
    step4: "none",
    step5: "none",
    step6: "none",
  };

  if (activeTrip) {
    const { data: participants } = await supabase
      .from("trip_participants")
      .select("id, guest_preferences(id, no_dietary_restrictions, allergies, dietary_restrictions)")
      .eq("trip_id", activeTrip.id);

    const { data: selection } = await supabase
      .from("trip_menu_selections")
      .select("selection_type, custom_notes, menus(name_en, name_es)")
      .eq("trip_id", activeTrip.id)
      .limit(1)
      .single();

    stepStatus = computeTripStepStatus(activeTrip, participants ?? [], selection, locale);

    if (selection) {
      if (selection.selection_type === "predefined" && selection.menus) {
        const m = selection.menus as unknown as { name_en: string; name_es: string };
        menuName = locale === "es" ? m.name_es : m.name_en;
      } else if (selection.selection_type === "surprise") {
        menuName = locale === "es" ? "Sorpresa del Chef" : "Chef's Surprise";
      } else if (selection.selection_type === "custom") {
        menuName = locale === "es" ? "Menú Personalizado" : "Custom Menu";
      }
    }
  }

  return (
    <GuestDashboardView
      locale={locale}
      trip={activeTrip ? {
        id: activeTrip.id,
        status: activeTrip.status,
        start_date: activeTrip.start_date,
        end_date: activeTrip.end_date,
        adult_count: activeTrip.adult_count,
        child_count: activeTrip.child_count,
        wizard_step: activeTrip.wizard_step,
      } : null}
      menuName={menuName}
      stepStatus={stepStatus}
    />
  );
}
