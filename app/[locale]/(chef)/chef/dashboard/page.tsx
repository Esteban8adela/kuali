import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getUpcomingTrips } from "@/app/[locale]/(chef)/chef/chef-actions";
import { ChefTripsBoard } from "@/components/chef/chef-trips-board";
import { categorizeChefTrips } from "@/lib/chef/categorize-trips";

export default async function ChefDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef.portal");

  const trips = await getUpcomingTrips();
  const categorized = categorizeChefTrips(trips);

  return (
    <div className="space-y-8">
      <header>
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#C4A052]">{t("greeting")}</p>
        <h1 className="font-display text-3xl text-[#1B3A4B] md:text-4xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-base text-neutral-600">{t("subtitle")}</p>
      </header>

      <ChefTripsBoard categorized={categorized} locale={locale} />
    </div>
  );
}
