import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepMenuSelection } from "@/components/guest/step-menu-selection";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";

export default async function TripMenuPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("id").eq("id", tripId).single();
  if (!trip) notFound();

  const { data: tripDates } = await supabase
    .from("trips")
    .select("start_date, end_date, child_count")
    .eq("id", tripId)
    .single();

  const { data: existingSelection } = await supabase
    .from("trip_menu_selections")
    .select("menu_id, selection_type, custom_notes")
    .eq("trip_id", tripId)
    .limit(1)
    .single();

  const stepStatus = await fetchTripStepStatus(tripId, locale);

  return (
    <>
      <WizardProgress currentStep={2} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepMenuSelection
          tripId={tripId}
          locale={locale}
          startDate={tripDates?.start_date}
          endDate={tripDates?.end_date}
          childCount={tripDates?.child_count ?? 0}
          initialSelection={existingSelection ?? undefined}
        />
      </main>
    </>
  );
}
