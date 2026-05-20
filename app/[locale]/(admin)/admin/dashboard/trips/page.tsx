import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";

export default async function AdminTripsPage({
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
    .select("id, status, adult_count, child_count, crew_count, payment_model, start_date")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl text-[#1B3A4B]">{t("trips")}</h1>
      <ul className="space-y-2">
        {trips?.map((trip) => (
          <li key={trip.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span>
              {trip.adult_count + trip.child_count} guests · crew {trip.crew_count}
            </span>
            <Badge variant="outline">{trip.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
