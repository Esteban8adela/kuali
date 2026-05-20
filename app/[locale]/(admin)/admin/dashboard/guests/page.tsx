import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function AdminGuestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, locale")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl text-[#1B3A4B]">{t("guests")}</h1>
      <ul className="space-y-2">
        {profiles?.map((p) => (
          <li key={p.id} className="flex justify-between rounded-lg border px-4 py-3">
            <span>{p.full_name ?? p.id}</span>
            <span className="text-sm capitalize text-neutral-500">{p.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
