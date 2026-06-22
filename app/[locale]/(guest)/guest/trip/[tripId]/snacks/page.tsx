import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepSnacks } from "@/components/guest/step-snacks";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";
import { normalizeBarOrder } from "@/lib/trip/wizard";
import { fetchGuestSnacksCatalog } from "@/lib/catalog/fetch-guest-catalogs";

export default async function TripSnacksPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, bar_order")
    .eq("id", tripId)
    .single();
  if (!trip) notFound();

  const barOrder = normalizeBarOrder(trip.bar_order);
  const initial = (barOrder.snacks ?? {}) as Record<string, unknown>;
  const stepStatus = await fetchTripStepStatus(tripId, locale);
  const catalog = await fetchGuestSnacksCatalog();

  return (
    <>
      <WizardProgress currentStep={4} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepSnacks tripId={tripId} locale={locale} catalog={catalog} initial={initial} />
      </main>
    </>
  );
}
