import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { AdminTripsTabs } from "@/components/admin/admin-trips-tabs";
import type { AdminTripRow } from "@/components/admin/admin-trips-tabs";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, adult_count, child_count, crew_count, created_at")
    .order("start_date", { ascending: true, nullsFirst: false });

  return (
    <div>
      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#C4A052]">{t("greeting")}</p>
      <h1 className="font-display mb-2 text-3xl text-[#1B3A4B]">{t("dashboard")}</h1>
      <p className="mb-8 text-neutral-600">{t("reservationsSubtitle")}</p>
      <AdminTripsTabs trips={(trips ?? []) as AdminTripRow[]} />
    </div>
  );
}
