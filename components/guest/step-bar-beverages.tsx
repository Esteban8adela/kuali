"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { advanceWizardStep, saveBarStep, saveDraftAndExit } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { CatalogMultiPicker, SpiritCategoryPicker } from "@/components/guest/catalog-multi-picker";
import { SPIRIT_SUBCATEGORIES } from "@/lib/constants/beverages";
import { filterCatalog } from "@/lib/catalog/utils";
import type { BarLineSelection, BarOrderPayload, CatalogItem } from "@/lib/catalog/types";

function formatResidualLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function flattenResidualItems(
  stock: unknown,
  prefix = ""
): Array<{ id: string; label: string; detail: string }> {
  if (stock === null || stock === undefined) return [];

  if (typeof stock === "string" || typeof stock === "number" || typeof stock === "boolean") {
    const detail = String(stock).trim();
    if (!detail) return [];
    return [{ id: prefix || "value", label: prefix ? formatResidualLabel(prefix) : "Item", detail }];
  }

  if (Array.isArray(stock)) {
    return stock.flatMap((item, index) =>
      flattenResidualItems(item, prefix ? `${prefix}-${index + 1}` : `item-${index + 1}`)
    );
  }

  if (typeof stock === "object") {
    return Object.entries(stock as Record<string, unknown>).flatMap(([key, value]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        return flattenResidualItems(value, nextPrefix);
      }
      return flattenResidualItems(value, nextPrefix);
    });
  }

  return [];
}

function BaseStockIncludedSection() {
  const t = useTranslations("guest.wizard.bar");

  const categories = [
    {
      key: "waters",
      subcategories: [
        {
          key: "natural_water",
          brands: ["bonafont", "evian", "fiji"] as const,
        },
        {
          key: "mineral_water",
          brands: ["topo_chico", "perrier", "san_pellegrino"] as const,
        },
      ],
    },
    {
      key: "sodas",
      subcategories: [
        {
          key: "soda_regular",
          brands: ["coca_cola", "sprite", "fanta", "ginger_ale"] as const,
        },
        {
          key: "soda_diet",
          brands: ["coca_light", "coca_zero", "sprite_zero"] as const,
        },
      ],
    },
  ] as const;

  return (
    <section className="space-y-4 rounded-xl border border-[#C4A052]/20 bg-white p-5">
      <h3 className="font-display text-lg text-[#1B3A4B]">{t("baseStockTitle")}</h3>
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.key}>
            <p className="font-semibold text-gray-800">{t(category.key)}</p>
            {category.subcategories.map((subcategory) => (
              <div key={subcategory.key} className="mt-2 pl-4">
                <p className="font-medium text-gray-700">
                  {t(`baseStockSubcategories.${subcategory.key}`)}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-8 text-sm text-gray-500">
                  {subcategory.brands.map((brand) => (
                    <li key={brand}>{t(`baseStockBrands.${brand}`)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function ResidualStockSection({ stock }: { stock: unknown }) {
  const t = useTranslations("guest.wizard.bar");
  const items = flattenResidualItems(stock);

  return (
    <section className="space-y-3 rounded-xl border border-[#1B3A4B]/20 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg text-[#1B3A4B]">{t("residualStockTitle")}</h3>
      {items.length === 0 ? (
        <p className="text-base text-neutral-800">{t("residualStockEmpty")}</p>
      ) : (
        <ul className="list-disc space-y-2 pl-4 marker:text-[#C4A052]">
          {items.map((item) => (
            <li key={item.id} className="text-base leading-relaxed text-neutral-800">
              {item.label !== item.detail ? (
                <>
                  <span className="font-medium text-neutral-900">{item.label}:</span> {item.detail}
                </>
              ) : (
                item.detail
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface StepBarBeveragesProps {
  tripId: string;
  catalog: CatalogItem[];
  initialBar?: Record<string, unknown>;
  locale: string;
  userRole?: string;
}

function emptySpirits(): Record<string, BarLineSelection[]> {
  return Object.fromEntries(SPIRIT_SUBCATEGORIES.map((s) => [s, []]));
}

function normalizeBarLineSelections(lines: BarLineSelection[] | undefined): BarLineSelection[] {
  return (lines ?? []).map((line) => ({
    ...line,
    quantity: line.quantity == null || line.quantity < 1 ? 1 : line.quantity,
  }));
}

function splitSpiritLines(lines: BarLineSelection[]): {
  catalog: BarLineSelection[];
  custom: string[];
} {
  const catalog: BarLineSelection[] = [];
  const custom: string[] = [];
  for (const line of lines) {
    if (line.catalogItemId) catalog.push(line);
    else if (line.label?.trim()) custom.push(line.label.trim());
  }
  return { catalog, custom };
}

function emptyCustomSpirits(): Record<string, string[]> {
  return Object.fromEntries(SPIRIT_SUBCATEGORIES.map((s) => [s, []]));
}

function parseCustomSpirits(raw?: Record<string, unknown>): Record<string, string[]> {
  const base = emptyCustomSpirits();
  const spiritsRaw = (raw?.spirits as Record<string, BarLineSelection[]>) ?? {};
  for (const sub of SPIRIT_SUBCATEGORIES) {
    const { custom } = splitSpiritLines(spiritsRaw[sub] ?? []);
    base[sub] = custom;
  }
  return base;
}

function parseInitialBar(raw?: Record<string, unknown>): BarOrderPayload & {
  customSpirits: Record<string, string[]>;
} {
  const r = raw ?? {};
  const spiritsRaw = (r.spirits as Record<string, BarLineSelection[]>) ?? emptySpirits();
  const spirits = Object.fromEntries(
    Object.entries({ ...emptySpirits(), ...spiritsRaw }).map(([key, lines]) => {
      const { catalog } = splitSpiritLines(lines ?? []);
      return [key, normalizeBarLineSelections(catalog)];
    })
  ) as Record<string, BarLineSelection[]>;

  return {
    byob: Boolean(r.byob),
    natural_water: false,
    mineral_water: false,
    soda_regular: false,
    soda_diet: false,
    chef_recommendation: Boolean(r.chef_recommendation),
    house_wine_by_glass: Boolean(r.house_wine_by_glass),
    spirits,
    wines: normalizeBarLineSelections(r.wines as BarLineSelection[] | undefined),
    beers: normalizeBarLineSelections(r.beers as BarLineSelection[] | undefined),
    mixers: normalizeBarLineSelections(r.mixers as BarLineSelection[] | undefined),
    customSpirits: parseCustomSpirits(r),
  };
}

export function StepBarBeverages({
  tripId,
  catalog,
  initialBar,
  locale,
  userRole,
}: StepBarBeveragesProps) {
  const t = useTranslations("guest.wizard.bar");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const init = parseInitialBar(initialBar);
  const [byob, setByob] = useState(init.byob);
  const [specificRequest, setSpecificRequest] = useState<string>(
    (initialBar?.specific_bottle_request as string) ?? ""
  );
  const [spirits, setSpirits] = useState(init.spirits);
  const [customSpirits, setCustomSpirits] = useState(init.customSpirits);
  const [wines, setWines] = useState(init.wines);
  const [beers, setBeers] = useState(init.beers);
  const [mixers, setMixers] = useState(init.mixers);

  function buildPayload(): Record<string, unknown> {
    const spiritsPayload = Object.fromEntries(
      SPIRIT_SUBCATEGORIES.map((sub) => {
        const catalogLines = spirits[sub] ?? [];
        const customLines = (customSpirits[sub] ?? [])
          .map((label) => label.trim())
          .filter(Boolean)
          .map((label) => ({ catalogItemId: null, label, quantity: 1 }));
        return [sub, [...catalogLines, ...customLines]];
      })
    );

    return {
      byob,
      specific_bottle_request: specificRequest,
      spirits: spiritsPayload,
      wines,
      beers,
      mixers,
    };
  }

  async function persistBar() {
    await saveBarStep({ tripId, barOrder: buildPayload() });
  }

  function handleContinue() {
    startTransition(async () => {
      await persistBar();
      await advanceWizardStep(tripId, 6);
      router.push(`/${locale}/guest/trip/${tripId}/overview`);
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await persistBar();
      await saveDraftAndExit(tripId);
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="rounded-xl border border-[#C4A052]/30 bg-[#C4A052]/10 px-4 py-3 text-sm text-[#1B3A4B]">
            {t("stockBanner")}
          </div>

          <BaseStockIncludedSection />

          <section className="space-y-3 rounded-xl border-2 border-[#C4A052]/40 bg-[#C4A052]/5 p-4">
            <Label className="text-base font-medium text-[#1B3A4B]">{t("specificRequestLabel")}</Label>
            <Textarea
              value={specificRequest}
              onChange={(e) => setSpecificRequest(e.target.value)}
              placeholder={t("specificRequestPlaceholder")}
              className="min-h-[100px] border-[#C4A052]/30 bg-white"
            />
          </section>

          <section className="flex items-center justify-between rounded-xl border border-[#1B3A4B]/15 bg-[#1B3A4B]/5 px-4 py-4">
            <Label className="text-base font-medium text-[#1B3A4B]">{t("byob")}</Label>
            <Switch checked={byob} onCheckedChange={setByob} />
          </section>

          <Separator className="bg-[#C4A052]/20" />

          <section className="space-y-6 rounded-xl border border-[#1B3A4B]/15 bg-[#1B3A4B]/5 p-4">
            <h3 className="font-display text-xl text-[#1B3A4B]">{t("spirits")}</h3>
            {SPIRIT_SUBCATEGORIES.map((sub) => (
              <SpiritCategoryPicker
                key={sub}
                title={t(`spiritOptions.${sub}`)}
                catalogItems={filterCatalog(catalog, "spirit", sub)}
                catalogSelections={spirits[sub] ?? []}
                customBrands={customSpirits[sub] ?? []}
                onCatalogChange={(next) => setSpirits((s) => ({ ...s, [sub]: next }))}
                onCustomBrandsChange={(next) =>
                  setCustomSpirits((s) => ({ ...s, [sub]: next }))
                }
                locale={locale}
                addLabel={t("addBrand")}
              />
            ))}
          </section>

          <section className="rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <CatalogMultiPicker
              title={t("wines")}
              items={filterCatalog(catalog, "wine")}
              selections={wines}
              onChange={setWines}
              locale={locale}
              addLabel={t("addWine")}
            />
          </section>

          <section className="rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <CatalogMultiPicker
              title={t("beers")}
              items={filterCatalog(catalog, "beer", null)}
              selections={beers}
              onChange={setBeers}
              locale={locale}
              addLabel={t("addBeer")}
            />
          </section>

          <section className="rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <CatalogMultiPicker
              title={t("mixers")}
              items={filterCatalog(catalog, "mixer", null)}
              selections={mixers}
              onChange={setMixers}
              locale={locale}
              addLabel={t("addMixer")}
            />
          </section>

          {userRole === "socio" && (
            <ResidualStockSection stock={initialBar?.residual_stock} />
          )}
        </CardContent>
      </Card>

      <WizardNav
        backHref={`/${locale}/guest/trip/${tripId}/snacks`}
        onContinue={handleContinue}
        onSaveExit={handleSaveExit}
        continueDisabled={pending}
        continueLoading={pending}
        saveExitLoading={pending}
      />
    </div>
  );
}
