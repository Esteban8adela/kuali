import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepPreferences } from "@/components/guest/step-preferences";
import type { GlobalMealSchedule } from "@/lib/catalog/types";

export default async function TripPreferencesPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, global_meal_schedule")
    .eq("id", tripId)
    .single();
  if (!trip) notFound();

  const { data: participants } = await supabase
    .from("trip_participants")
    .select("*, guest_preferences(*)")
    .eq("trip_id", tripId)
    .order("sort_order");

  return (
    <>
      <WizardProgress currentStep={3} />
      <main className="px-4 py-8 md:px-8">
        <StepPreferences
          tripId={tripId}
          participants={participants ?? []}
          initialGlobalSchedule={
            (trip.global_meal_schedule as GlobalMealSchedule) ?? {}
          }
          locale={locale}
        />
      </main>
    </>
  );
}
