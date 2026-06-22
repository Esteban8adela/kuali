"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NamedCatalogManager } from "@/components/admin/named-catalog-manager";
import { CHARCUTERIE_CATEGORIES } from "@/lib/validations/charcuterie-item";
import { SNACK_CATEGORIES } from "@/lib/constants/snacks";
import {
  createCharcuterieItem,
  deleteCharcuterieItem,
  updateCharcuterieItem,
} from "@/app/[locale]/(admin)/admin/charcuterie/actions";
import {
  createSnack,
  deleteSnack,
  updateSnack,
} from "@/app/[locale]/(admin)/admin/snacks/actions";
import {
  createAlwaysOnboardItem,
  deleteAlwaysOnboardItem,
  updateAlwaysOnboardItem,
} from "@/app/[locale]/(admin)/admin/always-onboard/actions";
import type { CharcuterieItem, AlwaysOnboardItem, Snack } from "@/lib/types/database";
import { useTranslations } from "next-intl";

interface PantryManagerProps {
  snacks: Snack[];
  alwaysOnboard: AlwaysOnboardItem[];
  charcuterie: CharcuterieItem[];
  locale: string;
}

export function PantryManager({ snacks, alwaysOnboard, charcuterie, locale }: PantryManagerProps) {
  const t = useTranslations("admin.pantry");

  const charcuterieByCategory = {
    meats: charcuterie.filter((i) => i.category === "meats"),
    cheeses: charcuterie.filter((i) => i.category === "cheeses"),
    complements: charcuterie.filter((i) => i.category === "complements"),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("snacksCard")}</CardTitle>
            <CardDescription>{t("snacksCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <NamedCatalogManager
              embedded
              items={snacks.map((i) => ({
                id: i.id,
                name: i.name,
                category: i.category,
                base_price_cents: i.base_price_cents,
              }))}
              locale={locale}
              i18nNamespace="admin.snacks"
              categories={SNACK_CATEGORIES}
              onCreate={createSnack}
              onUpdate={updateSnack}
              onDelete={deleteSnack}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("alwaysOnboardCard")}</CardTitle>
            <CardDescription>{t("alwaysOnboardCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <NamedCatalogManager
              embedded
              items={alwaysOnboard.map((i) => ({
                id: i.id,
                name: i.name,
                base_price_cents: i.base_price_cents,
              }))}
              locale={locale}
              i18nNamespace="admin.alwaysOnboard"
              onCreate={createAlwaysOnboardItem}
              onUpdate={updateAlwaysOnboardItem}
              onDelete={deleteAlwaysOnboardItem}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("charcuterieCard")}</CardTitle>
            <CardDescription>{t("charcuterieCardDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="meats">
              <TabsList className="mb-4">
                <TabsTrigger value="meats">{t("charcuterieMeats")}</TabsTrigger>
                <TabsTrigger value="cheeses">{t("charcuterieCheeses")}</TabsTrigger>
                <TabsTrigger value="complements">{t("charcuterieComplements")}</TabsTrigger>
              </TabsList>
              {(["meats", "cheeses", "complements"] as const).map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <NamedCatalogManager
                    embedded
                    defaultCategory={cat}
                    items={charcuterieByCategory[cat].map((i) => ({
                      id: i.id,
                      name: i.name,
                      category: i.category,
                      base_price_cents: i.base_price_cents,
                    }))}
                    locale={locale}
                    i18nNamespace="admin.charcuterie"
                    categories={CHARCUTERIE_CATEGORIES}
                    onCreate={createCharcuterieItem}
                    onUpdate={updateCharcuterieItem}
                    onDelete={deleteCharcuterieItem}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
