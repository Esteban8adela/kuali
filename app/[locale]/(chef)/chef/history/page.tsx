import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getUpcomingTrips } from "@/app/[locale]/(chef)/chef/chef-actions";
import { categorizeChefTrips } from "@/lib/chef/categorize-trips";
import { ChefTripsBoard } from "@/components/chef/chef-trips-board";

export default async function ChefHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef.history");

  const trips = await getUpcomingTrips();
  const { past } = categorizeChefTrips(trips);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
        <p className="mt-2 text-neutral-600">{t("subtitle")}</p>
      </header>
      <ChefTripsBoard
        categorized={{ present: [], future: [], past }}
        locale={locale}
        defaultTab="past"
        hideTabs
      />
    </div>
  );
}
