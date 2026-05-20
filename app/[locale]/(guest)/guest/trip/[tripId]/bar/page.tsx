import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepBarBeverages } from "@/components/guest/step-bar-beverages";

export default async function TripBarPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("id").eq("id", tripId).single();
  if (!trip) notFound();

  const { data: participants } = await supabase
    .from("trip_participants")
    .select("*, guest_preferences(*)")
    .eq("trip_id", tripId)
    .order("sort_order");

  return (
    <>
      <WizardProgress currentStep={4} />
      <main className="px-4 py-8 md:px-8">
        <StepBarBeverages
          tripId={tripId}
          participants={participants ?? []}
          locale={locale}
        />
      </main>
    </>
  );
}
