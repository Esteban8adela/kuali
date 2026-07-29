import { setRequestLocale } from "next-intl/server";
import { IngredientsManager } from "@/components/admin/ingredients-manager";
import { getIngredients } from "@/app/[locale]/(admin)/admin/catalog/admin-actions";

export default async function ChefCatalogIngredientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ingredients = await getIngredients();

  return <IngredientsManager ingredients={ingredients} locale={locale} />;
}
