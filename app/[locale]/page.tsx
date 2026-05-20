import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-2xl tracking-[0.2em] text-[#1B3A4B]">
          {t("common.brand")}
        </span>
        <LocaleSwitcher />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#C4A052]">
          {t("common.tagline")}
        </p>
        <h1 className="font-display max-w-3xl text-5xl font-medium leading-tight text-[#1B3A4B] md:text-7xl">
          {t("landing.hero")}
        </h1>
        <p className="mt-6 max-w-lg text-lg text-neutral-500">{t("landing.subtitle")}</p>
        <Link
          href={`/${locale}/login`}
          className="mt-12 inline-flex h-12 items-center justify-center rounded-md bg-[#C4A052] px-10 text-sm font-medium tracking-wide text-[#0A0A0A] transition hover:bg-[#C4A052]/90"
        >
          {t("landing.cta")}
        </Link>
      </main>

      <footer className="py-8 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Kualisto
      </footer>
    </div>
  );
}
