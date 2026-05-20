import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
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

  if (!trip) notFound();

  return (
    <>
      <WizardProgress currentStep={1} />
      <main className="px-4 py-8 md:px-8">
        <StepTripDetails trip={trip as Trip} locale={locale} />
      </main>
    </>
  );
}
