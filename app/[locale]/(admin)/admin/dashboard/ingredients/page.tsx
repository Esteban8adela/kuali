import { redirect } from "next/navigation";

export default async function LegacyIngredientsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/catalog/ingredients`);
}
