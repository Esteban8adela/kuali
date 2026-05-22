import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LiveOrdersPanel } from "@/components/chef/live-orders-panel";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function ChefDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef");

  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, status, adult_count, child_count")
    .in("status", ["submitted", "active"])
    .order("updated_at", { ascending: false })
    .limit(1);

  const activeTripId = trips?.[0]?.id ?? null;

  return (
    <div>
      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#C4A052]">{t("greeting")}</p>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("dashboard")}</h1>
        <Button variant="outline" disabled>
          {t("downloadPdf")}
        </Button>
      </div>
      {activeTripId ? (
        <LiveOrdersPanel tripId={activeTripId} />
      ) : (
        <p className="text-neutral-500">No active trips. Waiting for guest submissions.</p>
      )}
    </div>
  );
}
