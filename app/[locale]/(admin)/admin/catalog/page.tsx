import { redirect } from "next/navigation";

export default async function CatalogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/catalog/ingredients`);
}
