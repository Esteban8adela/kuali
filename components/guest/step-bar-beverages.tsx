"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { finalizeTripBooking, saveBarStep, saveDraftAndExit } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { CatalogMultiPicker } from "@/components/guest/catalog-multi-picker";
import { SPIRIT_SUBCATEGORIES } from "@/lib/catalog/default-catalog";
import { filterCatalog } from "@/lib/catalog/utils";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import type { BarLineSelection, BarOrderPayload, CatalogItem } from "@/lib/catalog/types";

function formatResidualValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatResidualValue).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${formatResidualValue(v)}`)
      .join("; ");
  }
  return String(value);
}

function residualStockEntries(stock: unknown): Array<{ label: string; value: string }> {
  if (!stock || typeof stock !== "object" || Array.isArray(stock)) return [];
  return Object.entries(stock as Record<string, unknown>)
    .map(([key, value]) => ({ label: key, value: formatResidualValue(value) }))
    .filter((e) => e.value.trim().length > 0);
}

function ResidualStockSection({ stock }: { stock: unknown }) {
  const t = useTranslations("guest.wizard.bar");
  const entries = residualStockEntries(stock);

  return (
    <section className="space-y-2 rounded-xl border border-[#1B3A4B]/20 bg-[#1B3A4B]/5 p-4">
      <h3 className="font-display text-lg text-[#1B3A4B]">{t("residualStockTitle")}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-600">{t("residualStockEmpty")}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          {entries.map(({ label, value }) => (
            <li key={label}>
              <span className="font-medium capitalize">{label.replace(/_/g, " ")}:</span> {value}
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

function parseInitialBar(raw?: Record<string, unknown>): BarOrderPayload {
  const r = raw ?? {};
  const spirits =
    (r.spirits as Record<string, BarLineSelection[]>) ?? emptySpirits();
  return {
    byob: Boolean(r.byob),
    natural_water: false,
    mineral_water: false,
    soda_regular: false,
    soda_diet: false,
    chef_recommendation: Boolean(r.chef_recommendation),
    house_wine_by_glass: Boolean(r.house_wine_by_glass),
    spirits: { ...emptySpirits(), ...spirits },
    wines: (r.wines as BarLineSelection[]) ?? [],
    beers: (r.beers as BarLineSelection[]) ?? [],
    mixers: (r.mixers as BarLineSelection[]) ?? [],
  };
}

export function StepBarBeverages({ tripId, catalog, initialBar, locale, userRole }: StepBarBeveragesProps) {
  const t = useTranslations("guest.wizard.bar");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const init = parseInitialBar(initialBar);
  const [byob, setByob] = useState(init.byob);
  const [specificRequest, setSpecificRequest] = useState<string>(
    (initialBar?.specific_bottle_request as string) ?? ""
  );
  const [spirits, setSpirits] = useState(init.spirits);
  const [wines, setWines] = useState(init.wines);
  const [beers, setBeers] = useState(init.beers);
  const [mixers, setMixers] = useState(init.mixers);

  function buildPayload(): Record<string, unknown> {
    return {
      byob,
      specific_bottle_request: specificRequest,
      spirits,
      wines,
      beers,
      mixers,
    };
  }

  const persistBar = useCallback(async () => {
    await saveBarStep({ tripId, barOrder: buildPayload() });
  }, [tripId, byob, specificRequest, spirits, wines, beers, mixers]);

  useWizardAutosave(persistBar, [byob, specificRequest, spirits, wines, beers, mixers]);

  function handleSubmit() {
    startTransition(async () => {
      await saveBarStep({ tripId, barOrder: buildPayload() });
      await finalizeTripBooking({
        tripId,
        barOrder: buildPayload(),
      });
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await saveBarStep({ tripId, barOrder: buildPayload() });
      await saveDraftAndExit(tripId);
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  const help = t("chefDefaultHelp");

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

          <section className="space-y-4 rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">{t("baseStockTitle")}</h3>
            <div className="space-y-3 text-sm text-neutral-700">
              <div>
                <p className="font-medium text-[#1B3A4B]">{t("waters")}</p>
                <p className="text-neutral-600">{t("baseStockWaters")}</p>
              </div>
              <div>
                <p className="font-medium text-[#1B3A4B]">{t("sodas")}</p>
                <p className="text-neutral-600">{t("baseStockSodas")}</p>
              </div>
            </div>
          </section>

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
              <CatalogMultiPicker
                key={sub}
                title={t(`spiritOptions.${sub}`)}
                items={filterCatalog(catalog, "spirit", sub)}
                selections={spirits[sub] ?? []}
                onChange={(next) => setSpirits((s) => ({ ...s, [sub]: next }))}
                locale={locale}
                helpText={help}
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
              helpText={help}
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
              helpText={help}
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
              helpText={help}
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
        onContinue={handleSubmit}
        onSaveExit={handleSaveExit}
        continueLabel={tc("save")}
        continueDisabled={pending}
        continueLoading={pending}
        saveExitLoading={pending}
      />
    </div>
  );
}
