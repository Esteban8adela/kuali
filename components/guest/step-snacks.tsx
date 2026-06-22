"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WizardNav } from "@/components/guest/wizard-nav";
import { advanceWizardStep, saveDraftAndExit, saveSnacksStep } from "@/app/[locale]/(guest)/guest/trip/actions";
import type { GuestCatalogItem, GuestSnacksCatalog } from "@/lib/catalog/fetch-guest-catalogs";
import { parseSnacksPayload, serializeSnacksPayload } from "@/lib/guest/snacks-selection";

interface StepSnacksProps {
  tripId: string;
  locale: string;
  catalog: GuestSnacksCatalog;
  initial?: Record<string, unknown>;
}

function CatalogCheckboxList({
  items,
  selectedIds,
  showOther,
  otherText,
  onToggle,
  onShowOther,
  onOtherText,
  otherLabel,
}: {
  items: GuestCatalogItem[];
  selectedIds: string[];
  showOther: boolean;
  otherText: string;
  onToggle: (id: string) => void;
  onShowOther: (on: boolean) => void;
  onOtherText: (value: string) => void;
  otherLabel: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selectedIds.includes(item.id)}
            onCheckedChange={() => onToggle(item.id)}
          />
          <span className="min-w-0 flex-1 break-words">{item.name}</span>
        </label>
      ))}
      <div className="flex w-full min-w-0 flex-col gap-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showOther} onCheckedChange={(v) => onShowOther(v === true)} />
          <span className="min-w-0 break-words">{otherLabel}</span>
        </label>
        {showOther ? (
          <Input
            type="text"
            value={otherText}
            onChange={(e) => onOtherText(e.target.value)}
            placeholder="Especifica qué necesitas..."
            className="h-9 w-full text-sm"
          />
        ) : null}
      </div>
      {!items.length && !showOther ? (
        <p className="text-sm text-neutral-500 sm:col-span-2">—</p>
      ) : null}
    </div>
  );
}

export function StepSnacks({ tripId, locale, catalog, initial }: StepSnacksProps) {
  const t = useTranslations("guest.wizard.snacks");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const parsedInitial = parseSnacksPayload(initial ?? {});

  const [snackIds, setSnackIds] = useState<string[]>(parsedInitial.snackItemIds);
  const [alwaysIds, setAlwaysIds] = useState<string[]>(parsedInitial.alwaysOnboardItemIds);
  const [charcuterieMeats, setCharcuterieMeats] = useState<string[]>(parsedInitial.charcuterie.meats);
  const [charcuterieCheeses, setCharcuterieCheeses] = useState<string[]>(parsedInitial.charcuterie.cheeses);
  const [charcuterieComplements, setCharcuterieComplements] = useState<string[]>(
    parsedInitial.charcuterie.complements
  );
  const [snackOtherOn, setSnackOtherOn] = useState(Boolean(parsedInitial.otherSnack?.trim()));
  const [otherSnack, setOtherSnack] = useState(parsedInitial.otherSnack ?? "");
  const [alwaysOtherOn, setAlwaysOtherOn] = useState(Boolean(parsedInitial.otherAlways?.trim()));
  const [otherAlways, setOtherAlways] = useState(parsedInitial.otherAlways ?? "");
  const [meatsOtherOn, setMeatsOtherOn] = useState(Boolean(parsedInitial.charcuterie.otherMeats?.trim()));
  const [otherMeats, setOtherMeats] = useState(parsedInitial.charcuterie.otherMeats ?? "");
  const [cheesesOtherOn, setCheesesOtherOn] = useState(Boolean(parsedInitial.charcuterie.otherCheeses?.trim()));
  const [otherCheeses, setOtherCheeses] = useState(parsedInitial.charcuterie.otherCheeses ?? "");
  const [complementsOtherOn, setComplementsOtherOn] = useState(
    Boolean(parsedInitial.charcuterie.otherComplements?.trim())
  );
  const [otherComplements, setOtherComplements] = useState(
    parsedInitial.charcuterie.otherComplements ?? ""
  );

  function toggleId(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function persistSnacks() {
    const payload = serializeSnacksPayload({
      snackItemIds: snackIds,
      alwaysOnboardItemIds: alwaysIds,
      charcuterie: {
        meats: charcuterieMeats,
        cheeses: charcuterieCheeses,
        complements: charcuterieComplements,
        otherMeats: meatsOtherOn ? otherMeats.trim() || null : null,
        otherCheeses: cheesesOtherOn ? otherCheeses.trim() || null : null,
        otherComplements: complementsOtherOn ? otherComplements.trim() || null : null,
      },
      otherSnack: snackOtherOn ? otherSnack.trim() || null : null,
      otherAlways: alwaysOtherOn ? otherAlways.trim() || null : null,
    });
    await saveSnacksStep({ tripId, payload });
  }

  function handleContinue() {
    startTransition(async () => {
      await persistSnacks();
      await advanceWizardStep(tripId, 5);
      router.push(`/${locale}/guest/trip/${tripId}/bar`);
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await persistSnacks();
      await saveDraftAndExit(tripId);
      router.push(`/${locale}/guest/dashboard`);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <Label>{t("snacksToBuy")}</Label>
            <CatalogCheckboxList
              items={catalog.snacks}
              selectedIds={snackIds}
              showOther={snackOtherOn}
              otherText={otherSnack}
              onToggle={(id) => toggleId(snackIds, setSnackIds, id)}
              onShowOther={(on) => {
                setSnackOtherOn(on);
                if (!on) setOtherSnack("");
              }}
              onOtherText={setOtherSnack}
              otherLabel={t("otherOption")}
            />
          </section>

          <section className="space-y-3">
            <Label>{t("alwaysOnboard")}</Label>
            <CatalogCheckboxList
              items={catalog.alwaysOnboard}
              selectedIds={alwaysIds}
              showOther={alwaysOtherOn}
              otherText={otherAlways}
              onToggle={(id) => toggleId(alwaysIds, setAlwaysIds, id)}
              onShowOther={(on) => {
                setAlwaysOtherOn(on);
                if (!on) setOtherAlways("");
              }}
              onOtherText={setOtherAlways}
              otherLabel={t("otherOption")}
            />
          </section>

          <section className="min-w-0 space-y-4 overflow-hidden rounded-xl border border-[#C4A052]/20 bg-[#C4A052]/5 p-5">
            <div>
              <Label className="text-base font-medium text-gray-900">
                {t("charcuterieSectionTitle")}
              </Label>
              <p className="mt-0.5 text-xs text-gray-500">{t("charcuterieHelp")}</p>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label className="text-sm font-medium">{t("charcuterieMeats")}</Label>
                <CatalogCheckboxList
                  items={catalog.charcuterie.meats}
                  selectedIds={charcuterieMeats}
                  showOther={meatsOtherOn}
                  otherText={otherMeats}
                  onToggle={(id) => toggleId(charcuterieMeats, setCharcuterieMeats, id)}
                  onShowOther={(on) => {
                    setMeatsOtherOn(on);
                    if (!on) setOtherMeats("");
                  }}
                  onOtherText={setOtherMeats}
                  otherLabel={t("otherOption")}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label className="text-sm font-medium">{t("charcuterieCheeses")}</Label>
                <CatalogCheckboxList
                  items={catalog.charcuterie.cheeses}
                  selectedIds={charcuterieCheeses}
                  showOther={cheesesOtherOn}
                  otherText={otherCheeses}
                  onToggle={(id) => toggleId(charcuterieCheeses, setCharcuterieCheeses, id)}
                  onShowOther={(on) => {
                    setCheesesOtherOn(on);
                    if (!on) setOtherCheeses("");
                  }}
                  onOtherText={setOtherCheeses}
                  otherLabel={t("otherOption")}
                />
              </div>
            </div>
            <div className="min-w-0 border-t border-[#C4A052]/15 pt-5">
              <Label className="text-sm font-medium">{t("charcuterieComplements")}</Label>
              <CatalogCheckboxList
                items={catalog.charcuterie.complements}
                selectedIds={charcuterieComplements}
                showOther={complementsOtherOn}
                otherText={otherComplements}
                onToggle={(id) => toggleId(charcuterieComplements, setCharcuterieComplements, id)}
                onShowOther={(on) => {
                  setComplementsOtherOn(on);
                  if (!on) setOtherComplements("");
                }}
                onOtherText={setOtherComplements}
                otherLabel={t("otherOption")}
              />
            </div>
          </section>
        </CardContent>
      </Card>
      <WizardNav
        backHref={`/${locale}/guest/trip/${tripId}/preferences`}
        onContinue={handleContinue}
        onSaveExit={handleSaveExit}
        continueDisabled={pending}
        continueLoading={pending}
        saveExitLoading={pending}
      />
    </div>
  );
}
