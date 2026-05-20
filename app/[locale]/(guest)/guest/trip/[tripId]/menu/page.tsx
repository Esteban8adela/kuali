import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WizardProgress } from "@/components/guest/wizard-progress";
import { StepMenuSelection } from "@/components/guest/step-menu-selection";
import type { Menu } from "@/lib/types/database";

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

  const { data: menus } = await supabase
    .from("menus")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <WizardProgress currentStep={2} />
      <main className="px-4 py-8 md:px-8">
        <StepMenuSelection tripId={tripId} menus={(menus ?? []) as Menu[]} locale={locale} />
      </main>
    </>
  );
}
