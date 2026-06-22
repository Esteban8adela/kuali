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
import { formatCurrency, centsToUsd } from "@/lib/utils";

interface StepSnacksProps {
  tripId: string;
  locale: string;
  catalog: GuestSnacksCatalog;
  initial?: Record<string, unknown>;
}

function CatalogCheckboxList({
  items,
  selectedIds,
  onToggle,
  customNotes,
  onCustomNote,
  locale,
}: {
  items: GuestCatalogItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  customNotes: Record<string, string>;
  onCustomNote: (id: string, value: string) => void;
  locale: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">—</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selectedIds.includes(item.id)}
              onCheckedChange={() => onToggle(item.id)}
            />
            <span className="min-w-0 flex-1 break-words">
              {item.name}
              <span className="ml-1 text-xs text-neutral-500">
                ({formatCurrency(centsToUsd(item.base_price_cents), locale)})
              </span>
            </span>
          </label>
          {item.allows_custom_note && selectedIds.includes(item.id) && (
            <Input
              type="text"
              value={customNotes[item.id] ?? ""}
              onChange={(e) => onCustomNote(item.id, e.target.value)}
              className="ml-6 h-9 text-sm"
            />
          )}
        </div>
      ))}
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
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});

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
        otherMeats: null,
        otherCheeses: null,
        otherComplements: null,
      },
      otherSnack: parsedInitial.otherSnack,
      otherAlways: parsedInitial.otherAlways,
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
              onToggle={(id) => toggleId(snackIds, setSnackIds, id)}
              customNotes={customNotes}
              onCustomNote={(id, v) => setCustomNotes((p) => ({ ...p, [id]: v }))}
              locale={locale}
            />
          </section>

          <section className="space-y-3">
            <Label>{t("alwaysOnboard")}</Label>
            <CatalogCheckboxList
              items={catalog.alwaysOnboard}
              selectedIds={alwaysIds}
              onToggle={(id) => toggleId(alwaysIds, setAlwaysIds, id)}
              customNotes={customNotes}
              onCustomNote={(id, v) => setCustomNotes((p) => ({ ...p, [id]: v }))}
              locale={locale}
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("charcuterieMeats")}</Label>
                <CatalogCheckboxList
                  items={catalog.charcuterie.meats}
                  selectedIds={charcuterieMeats}
                  onToggle={(id) => toggleId(charcuterieMeats, setCharcuterieMeats, id)}
                  customNotes={customNotes}
                  onCustomNote={(id, v) => setCustomNotes((p) => ({ ...p, [id]: v }))}
                  locale={locale}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("charcuterieCheeses")}</Label>
                <CatalogCheckboxList
                  items={catalog.charcuterie.cheeses}
                  selectedIds={charcuterieCheeses}
                  onToggle={(id) => toggleId(charcuterieCheeses, setCharcuterieCheeses, id)}
                  customNotes={customNotes}
                  onCustomNote={(id, v) => setCustomNotes((p) => ({ ...p, [id]: v }))}
                  locale={locale}
                />
              </div>
            </div>
            <div className="min-w-0 border-t border-[#C4A052]/15 pt-5">
              <Label className="text-sm font-medium">{t("charcuterieComplements")}</Label>
              <CatalogCheckboxList
                items={catalog.charcuterie.complements}
                selectedIds={charcuterieComplements}
                onToggle={(id) => toggleId(charcuterieComplements, setCharcuterieComplements, id)}
                customNotes={customNotes}
                onCustomNote={(id, v) => setCustomNotes((p) => ({ ...p, [id]: v }))}
                locale={locale}
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
