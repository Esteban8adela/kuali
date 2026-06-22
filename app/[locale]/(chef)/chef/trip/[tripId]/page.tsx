import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTripDetails } from "@/app/[locale]/(chef)/chef/chef-actions";
import { ServiceOrderReport } from "@/components/chef/service-order-report";

export default async function ChefTripServiceOrderPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const data = await getTripDetails(tripId);
  if (!data) notFound();

  return <ServiceOrderReport data={data} locale={locale} />;
}
