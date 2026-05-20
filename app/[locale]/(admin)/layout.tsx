import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
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
  const tc = await getTranslations("common");

  return (
    <RoleGate allowed={["admin"]} locale={locale}>
      <div className="flex min-h-dvh">
        <aside className="hidden w-56 flex-col border-r border-[#C4A052]/15 bg-[#0A0A0A] p-6 text-white md:flex">
          <span className="font-display text-xl tracking-wider text-[#C4A052]">{tc("brand")}</span>
          <nav className="mt-8 flex flex-col gap-2 text-sm">
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
          </nav>
        </aside>
        <main className="flex-1 bg-[#FAFAF8] p-6 md:p-10">{children}</main>
      </div>
    </RoleGate>
  );
}
