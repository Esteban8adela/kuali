import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <RoleGate allowed={["admin"]} locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <AuthNavbar />
        <div className="flex flex-1">
          <aside className="hidden w-56 flex-col border-r border-[#C4A052]/15 bg-[#0A0A0A] p-6 text-white md:flex">
            <nav className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/admin/dashboard`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("dashboard")}
              </Link>
              <Link href={`/${locale}/admin/dashboard/menus`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("menus")}
              </Link>
              <Link href={`/${locale}/admin/dashboard/trips`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("trips")}
              </Link>
              <Link href={`/${locale}/admin/dashboard/guests`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("guests")}
              </Link>
              <Link href={`/${locale}/admin/catalog/ingredients`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("catalogNav")}
              </Link>
              <Link href={`/${locale}/admin/snacks`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("snacksNav")}
              </Link>
              <Link href={`/${locale}/admin/beverages`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("beveragesNav")}
              </Link>
              <Link href={`/${locale}/admin/charcuterie`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("charcuterieNav")}
              </Link>
              <Link href={`/${locale}/admin/always-onboard`} className="rounded px-3 py-2 hover:bg-white/10">
                {t("alwaysOnboardNav")}
              </Link>
            </nav>
          </aside>
          <main className="flex-1 bg-[#FAFAF8] p-6 md:p-10">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
