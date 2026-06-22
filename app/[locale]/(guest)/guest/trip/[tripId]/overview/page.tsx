import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepOrderOverview } from "@/components/guest/step-order-overview";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";
import { fetchOrderOverview } from "@/lib/guest/fetch-order-overview";

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const [overview, stepStatus] = await Promise.all([
    fetchOrderOverview(tripId),
    fetchTripStepStatus(tripId, locale),
  ]);

  if (!overview) notFound();

  return (
    <>
      <WizardProgress currentStep={6} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepOrderOverview data={overview} locale={locale} />
      </main>
    </>
  );
}
