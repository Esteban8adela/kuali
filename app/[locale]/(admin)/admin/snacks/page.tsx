import { setRequestLocale } from "next-intl/server";
import { SnacksManager } from "@/components/admin/snacks-manager";
import { getSnacks } from "@/app/[locale]/(admin)/admin/snacks/actions";

export default async function AdminSnacksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const snacks = await getSnacks();

  return <SnacksManager snacks={snacks} locale={locale} />;
}
