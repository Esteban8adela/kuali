import { setRequestLocale } from "next-intl/server";
import { AdminTripsManager } from "@/components/admin/admin-trips-manager";
import { getAdminTrips } from "@/app/[locale]/(admin)/admin/admin-ops-actions";

export default async function AdminTripsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const trips = await getAdminTrips();

  return <AdminTripsManager trips={trips} locale={locale} />;
}
