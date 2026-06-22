import { setRequestLocale } from "next-intl/server";
import { BeveragesManager } from "@/components/admin/beverages-manager";
import { getBeverages } from "@/app/[locale]/(admin)/admin/beverages/actions";

export default async function AdminBeveragesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getBeverages();

  return <BeveragesManager items={items} locale={locale} />;
}
