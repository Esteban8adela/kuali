import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepTripDetails } from "@/components/guest/step-trip-details";
import type { Trip } from "@/lib/types/database";

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).single();
  const { data: participants } = await supabase
    .from("trip_participants")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order");

  if (!trip) notFound();

  const stepStatus = await fetchTripStepStatus(tripId, locale);

  return (
    <>
      <WizardProgress currentStep={1} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepTripDetails
          trip={trip as Trip}
          participants={participants ?? []}
          locale={locale}
        />
      </main>
    </>
  );
}
