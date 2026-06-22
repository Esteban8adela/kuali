import { setRequestLocale } from "next-intl/server";
import { NamedCatalogManager } from "@/components/admin/named-catalog-manager";
import { CHARCUTERIE_CATEGORIES } from "@/lib/validations/charcuterie-item";
import {
  createCharcuterieItem,
  deleteCharcuterieItem,
  getCharcuterieItems,
  updateCharcuterieItem,
} from "@/app/[locale]/(admin)/admin/charcuterie/actions";

export default async function AdminCharcuteriePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getCharcuterieItems();

  return (
    <NamedCatalogManager
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        base_price_cents: i.base_price_cents,
      }))}
      locale={locale}
      i18nNamespace="admin.charcuterie"
      categories={CHARCUTERIE_CATEGORIES}
      onCreate={createCharcuterieItem}
      onUpdate={updateCharcuterieItem}
      onDelete={deleteCharcuterieItem}
    />
  );
}
