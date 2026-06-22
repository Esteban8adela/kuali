import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getTripDetails } from "@/app/[locale]/(chef)/chef/chef-actions";
import { ShoppingListReport } from "@/components/chef/shopping-list-report";

export default async function ChefShoppingListPage({
  params,
}: {
  params: Promise<{ locale: string; tripId: string }>;
}) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef.shoppingList");

  const data = await getTripDetails(tripId);
  if (!data) notFound();

  return (
    <div className="print:bg-white">
      <div className="no-print mb-6">
        <Link
          href={`/${locale}/chef/trip/${tripId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1B3A4B] hover:text-[#C4A052]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToServiceOrder")}
        </Link>
      </div>
      <ShoppingListReport data={data} locale={locale} />
    </div>
  );
}
