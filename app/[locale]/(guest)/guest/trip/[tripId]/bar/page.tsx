import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepBarBeverages } from "@/components/guest/step-bar-beverages";
import { fetchCatalogItems } from "@/lib/catalog/fetch-catalog";
import { fetchTripStepStatus } from "@/lib/trip/fetch-trip-step-status";
import { normalizeBarOrder } from "@/lib/trip/wizard";

export default async function TripBarPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, bar_order")
    .eq("id", tripId)
    .single();

  if (tripError) {
    console.error("[TripBarPage] trips select failed", tripError);
    throw tripError;
  }
  if (!trip) notFound();

  let userRole = "renta";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = (profile?.role as string) ?? "renta";
  }

  const catalog = await fetchCatalogItems();
  const stepStatus = await fetchTripStepStatus(tripId, locale);

  return (
    <>
      <WizardProgress currentStep={5} tripId={tripId} locale={locale} stepStatus={stepStatus} />
      <main className="px-4 py-8 md:px-8">
        <StepBarBeverages
          tripId={tripId}
          catalog={catalog}
          initialBar={normalizeBarOrder(trip.bar_order)}
          locale={locale}
          userRole={userRole}
        />
      </main>
    </>
  );
}
