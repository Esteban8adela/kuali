import { setRequestLocale } from "next-intl/server";
import { CatalogNav } from "@/components/admin/catalog-nav";

export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <CatalogNav locale={locale} />
      {children}
    </div>
  );
}
