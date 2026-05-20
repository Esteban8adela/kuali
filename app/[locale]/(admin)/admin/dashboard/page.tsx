import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const supabase = await createClient();
  const [{ count: trips }, { count: menus }, { count: profiles }] = await Promise.all([
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("menus").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl text-[#1B3A4B]">{t("dashboard")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("trips")}</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl">{trips ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("menus")}</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl">{menus ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("guests")}</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl">{profiles ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
