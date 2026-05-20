import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function TripIndexPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/guest/trip/${tripId}/details`);
}
