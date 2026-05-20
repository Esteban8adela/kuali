import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { StockTable } from "@/components/chef/stock-table";
import { getTranslations } from "next-intl/server";
import type { TripStockLine } from "@/lib/types/database";

export default async function ChefStockPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef");

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .in("status", ["submitted", "active"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let lines: TripStockLine[] = [];
  if (trip) {
    const { data } = await supabase
      .from("trip_stock_lines")
      .select("*, stock_items(sku, name_en, name_es, category)")
      .eq("trip_id", trip.id);
    lines = (data ?? []) as TripStockLine[];
  }

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl text-[#1B3A4B]">{t("stock")}</h1>
      {trip ? (
        <StockTable tripId={trip.id} lines={lines} />
      ) : (
        <p className="text-neutral-500">No active trip for stock tracking.</p>
      )}
    </div>
  );
}
