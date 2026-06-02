import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepMenuSelection } from "@/components/guest/step-menu-selection";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";
import { fetchDishesCatalog } from "@/lib/guest/fetch-dishes-catalog";
import { normalizeDateOnlyInput } from "@/lib/trip/date-validation";

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

  const [{ data: tripDates }, dishesByCategory, stepStatus] = await Promise.all([
    supabase
      .from("trips")
      .select("start_date, end_date, child_count, menu_order")
      .eq("id", tripId)
      .single(),
    fetchDishesCatalog(),
    fetchTripStepStatus(tripId, locale),
  ]);

  const tripStart = normalizeDateOnlyInput(tripDates?.start_date ?? null);
  const tripEnd = normalizeDateOnlyInput(tripDates?.end_date ?? null);

  return (
    <>
      <WizardProgress currentStep={2} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepMenuSelection
          tripId={tripId}
          locale={locale}
          startDate={tripStart}
          endDate={tripEnd}
          childCount={tripDates?.child_count ?? 0}
          initialMenuOrder={tripDates?.menu_order}
          dishesByCategory={dishesByCategory}
        />
      </main>
    </>
  );
}
