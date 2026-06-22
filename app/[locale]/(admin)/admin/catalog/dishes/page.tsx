import { setRequestLocale } from "next-intl/server";
import { DishesManager } from "@/components/admin/dishes-manager";
import { getDishes, getIngredients } from "../admin-actions";

export default async function CatalogDishesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [dishes, ingredients] = await Promise.all([getDishes(), getIngredients()]);

  return (
    <DishesManager dishes={dishes} ingredients={ingredients} locale={locale} />
  );
}