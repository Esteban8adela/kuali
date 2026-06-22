import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ChefLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chef");

  return (
    <RoleGate allowed={["chef", "admin"]} locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <AuthNavbar />
        <div className="flex flex-1 items-start print:block">
          <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-[#C4A052]/15 bg-[#1B3A4B] p-6 text-white print:hidden md:flex">
            <nav className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/chef/dashboard`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("dashboard")}
              </Link>
              <Link href={`/${locale}/chef/dashboard/stock`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("stock")}
              </Link>
              <Link href={`/${locale}/chef/dashboard/costing`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("costing")}
              </Link>
            </nav>
          </aside>
          <main className="flex-1 bg-[#FAFAF8] p-6 md:p-10 print:bg-white print:p-0">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
