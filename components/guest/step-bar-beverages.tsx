"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { finalizeTripBooking } from "@/app/[locale]/(guest)/guest/trip/actions";
import { WizardNav } from "@/components/guest/wizard-nav";
import { CatalogMultiPicker } from "@/components/guest/catalog-multi-picker";
import { SPIRIT_SUBCATEGORIES } from "@/lib/catalog/default-catalog";
import { filterCatalog } from "@/lib/catalog/utils";
import type { BarLineSelection, BarOrderPayload, CatalogItem } from "@/lib/catalog/types";

interface StepBarBeveragesProps {
  tripId: string;
  catalog: CatalogItem[];
  initialBar?: Record<string, unknown>;
  locale: string;
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
    natural_water: r.natural_water !== false,
    mineral_water: r.mineral_water !== false,
    soda_regular: r.soda_regular !== false,
    soda_diet: Boolean(r.soda_diet),
    chef_recommendation: Boolean(r.chef_recommendation),
    house_wine_by_glass: Boolean(r.house_wine_by_glass),
    spirits: { ...emptySpirits(), ...spirits },
    wines: (r.wines as BarLineSelection[]) ?? [],
    beers: (r.beers as BarLineSelection[]) ?? [],
    mixers: (r.mixers as BarLineSelection[]) ?? [],
  };
}

export function StepBarBeverages({ tripId, catalog, initialBar, locale }: StepBarBeveragesProps) {
  const t = useTranslations("guest.wizard.bar");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const init = parseInitialBar(initialBar);
  const [byob, setByob] = useState(init.byob);
  const [natural, setNatural] = useState(init.natural_water);
  const [mineral, setMineral] = useState(init.mineral_water);
  const [sodaRegular, setSodaRegular] = useState(init.soda_regular);
  const [sodaDiet, setSodaDiet] = useState(init.soda_diet);
  const [chefRec, setChefRec] = useState(init.chef_recommendation);
  const [houseGlass, setHouseGlass] = useState(init.house_wine_by_glass);
  const [spirits, setSpirits] = useState(init.spirits);
  const [wines, setWines] = useState(init.wines);
  const [beers, setBeers] = useState(init.beers);
  const [mixers, setMixers] = useState(init.mixers);

  function buildPayload(): BarOrderPayload {
    return {
      byob,
      natural_water: natural,
      mineral_water: mineral,
      soda_regular: sodaRegular,
      soda_diet: sodaDiet,
      chef_recommendation: chefRec,
      house_wine_by_glass: houseGlass,
      spirits,
      wines,
      beers,
      mixers,
    };
  }

  function handleSubmit() {
    startTransition(async () => {
      await finalizeTripBooking({
        tripId,
        barOrder: buildPayload() as unknown as Record<string, unknown>,
      });
      router.push(`/${locale}`);
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
          <section className="flex items-center justify-between rounded-xl border-2 border-[#C4A052]/40 bg-[#C4A052]/5 px-4 py-4">
            <Label className="text-base font-medium text-[#1B3A4B]">{t("byob")}</Label>
            <Switch checked={byob} onCheckedChange={setByob} />
          </section>

          <section className="space-y-4 rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">{t("waters")}</h3>
            <div className="flex items-center justify-between">
              <Label>{t("natural")}</Label>
              <Switch checked={natural} onCheckedChange={setNatural} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("mineral")}</Label>
              <Switch checked={mineral} onCheckedChange={setMineral} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">{t("sodas")}</h3>
            <div className="flex items-center justify-between">
              <Label>{t("regular")}</Label>
              <Switch checked={sodaRegular} onCheckedChange={setSodaRegular} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("diet")}</Label>
              <Switch checked={sodaDiet} onCheckedChange={setSodaDiet} />
            </div>
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

          <section className="space-y-3 rounded-xl border border-[#C4A052]/20 bg-white p-4">
            <h3 className="font-display text-lg text-[#1B3A4B]">{t("extras")}</h3>
            <div className="flex items-center justify-between">
              <Label>{t("chefRecommendation")}</Label>
              <Switch checked={chefRec} onCheckedChange={setChefRec} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("houseByGlass")}</Label>
              <Switch checked={houseGlass} onCheckedChange={setHouseGlass} />
            </div>
          </section>
        </CardContent>
      </Card>

      <WizardNav
        backHref={`/${locale}/guest/trip/${tripId}/preferences`}
        onContinue={handleSubmit}
        continueLabel={tc("save")}
        continueDisabled={pending}
        continueLoading={pending}
      />
    </div>
  );
}
