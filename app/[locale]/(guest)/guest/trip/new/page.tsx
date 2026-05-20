import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createTrip } from "../actions";

export default async function NewTripPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tripId = await createTrip(locale);
  redirect(`/${locale}/guest/trip/${tripId}/details`);
}
