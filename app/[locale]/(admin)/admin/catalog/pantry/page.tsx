import { setRequestLocale } from "next-intl/server";
import { PantryManager } from "@/components/admin/pantry-manager";
import { getSnacks } from "@/app/[locale]/(admin)/admin/snacks/actions";
import { getCharcuterieItems } from "@/app/[locale]/(admin)/admin/charcuterie/actions";
import { getAlwaysOnboardItems } from "@/app/[locale]/(admin)/admin/always-onboard/actions";

export default async function CatalogPantryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [snacks, charcuterie, alwaysOnboard] = await Promise.all([
    getSnacks(),
    getCharcuterieItems(),
    getAlwaysOnboardItems(),
  ]);

  return (
    <PantryManager
      snacks={snacks}
      charcuterie={charcuterie}
      alwaysOnboard={alwaysOnboard}
      locale={locale}
    />
  );
}
