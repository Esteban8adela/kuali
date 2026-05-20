import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { getTranslations } from "next-intl/server";

export default async function GuestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <RoleGate allowed={["renta", "socio"]} locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-[#C4A052]/10 px-4 py-4 md:px-8">
          <span className="font-display text-xl tracking-[0.15em] text-[#1B3A4B]">{t("brand")}</span>
          <LocaleSwitcher />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </RoleGate>
  );
}
