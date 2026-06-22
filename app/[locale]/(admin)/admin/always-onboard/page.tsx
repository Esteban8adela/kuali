import { setRequestLocale } from "next-intl/server";
import { NamedCatalogManager } from "@/components/admin/named-catalog-manager";
import { localizedPantryItemName } from "@/lib/catalog/utils";
import {
  createAlwaysOnboardItem,
  deleteAlwaysOnboardItem,
  getAlwaysOnboardItems,
  updateAlwaysOnboardItem,
} from "@/app/[locale]/(admin)/admin/always-onboard/actions";

export default async function AdminAlwaysOnboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getAlwaysOnboardItems();

  return (
    <NamedCatalogManager
      bilingual
      items={items.map((i) => ({
        id: i.id,
        name: localizedPantryItemName(i, locale),
        name_en: i.name_en ?? i.name,
        name_es: i.name_es ?? i.name,
        base_price_cents: i.base_price_cents,
      }))}
      locale={locale}
      i18nNamespace="admin.alwaysOnboard"
      onCreate={createAlwaysOnboardItem}
      onUpdate={updateAlwaysOnboardItem}
      onDelete={deleteAlwaysOnboardItem}
    />
  );
}
