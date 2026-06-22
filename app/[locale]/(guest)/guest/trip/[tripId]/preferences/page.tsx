import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepPreferences } from "@/components/guest/step-preferences";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";

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
    .select("id")
    .eq("id", tripId)
    .single();
  if (!trip) notFound();

  const { data: participants } = await supabase
    .from("trip_participants")
    .select("*, guest_preferences(*)")
    .eq("trip_id", tripId)
    .order("sort_order");

  const stepStatus = await fetchTripStepStatus(tripId, locale);

  return (
    <>
      <WizardProgress currentStep={3} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepPreferences
          tripId={tripId}
          participants={participants ?? []}
          locale={locale}
        />
      </main>
    </>
  );
}
