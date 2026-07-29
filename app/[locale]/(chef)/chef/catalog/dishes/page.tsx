import { setRequestLocale } from "next-intl/server";
import { DishesManager } from "@/components/admin/dishes-manager";
import {
  getDishes,
  getIngredients,
} from "@/app/[locale]/(admin)/admin/catalog/admin-actions";
import { isRegularDishCategory } from "@/lib/constants/dishes";

export default async function ChefCatalogDishesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [allDishes, ingredients] = await Promise.all([getDishes(), getIngredients()]);
  const dishes = allDishes.filter((d) => isRegularDishCategory(d.category));

  return (
    <DishesManager dishes={dishes} ingredients={ingredients} locale={locale} mode="regular" />
  );
}
