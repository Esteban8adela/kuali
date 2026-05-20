import { setRequestLocale } from "next-intl/server";
import { IngredientCostPanel } from "@/components/chef/ingredient-cost-panel";
import { getTranslations } from "next-intl/server";

export default async function ChefCostingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef");

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl text-[#1B3A4B]">{t("costing")}</h1>
      <IngredientCostPanel />
    </div>
  );
}
