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
import {
  CHARCUTERIE_CHEESE_KEYS,
  CHARCUTERIE_COMPLEMENT_KEYS,
  CHARCUTERIE_MEAT_KEYS,
  parseCharcuterieSelections,
  serializeCharcuterieSelections,
  type CharcuterieSelections,
} from "@/lib/guest/charcuterie-selections";

const SNACK_KEYS = ["chips", "maruchan", "mango_snacks", "candies", "other"] as const;
const ALWAYS_KEYS = ["pico_de_gallo", "salsas", "cacahuates", "fruit", "other"] as const;

const LEGACY_SNACK_MAP: Record<string, string> = {
  Papas: "chips",
  Maruchan: "maruchan",
  Manguitos: "mango_snacks",
  Dulces: "candies",
  Otro: "other",
  Other: "other",
};

const LEGACY_ALWAYS_MAP: Record<string, string> = {
  "Pico de gallo": "pico_de_gallo",
  Salsas: "salsas",
  Cacahuates: "cacahuates",
  Fruta: "fruit",
  Otro: "other",
  Other: "other",
};

function normalizeKeys(values: string[], legacyMap: Record<string, string>): string[] {
  return values.map((v) => legacyMap[v] ?? v);
}

interface StepSnacksProps {
  tripId: string;
  locale: string;
  initial?: Record<string, unknown>;
}

type CharcuterieCategory = "meats" | "cheeses" | "complements";

interface CharcuterieCheckboxGroupProps {
  title: string;
  keys: readonly string[];
  selected: string[];
  otherValue: string;
  translationPrefix: string;
  onToggle: (key: string) => void;
  onOtherChange: (value: string) => void;
  otherPlaceholder: string;
  t: ReturnType<typeof useTranslations<"guest.wizard.snacks">>;
}

function CharcuterieCheckboxGroup({
  title,
  keys,
  selected,
  otherValue,
  translationPrefix,
  onToggle,
  onOtherChange,
  otherPlaceholder,
  t,
}: CharcuterieCheckboxGroupProps) {
  return (
    <div className="min-w-0 space-y-3">
      <Label className="text-sm font-medium text-gray-800">{title}</Label>
      <div className="space-y-2">
        {keys.map((key) => (
          <div key={key} className="min-w-0 space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox checked={selected.includes(key)} onCheckedChange={() => onToggle(key)} />
              <span className="min-w-0 break-words">
                {t(
                  `${translationPrefix}.${key}` as
                    | "charcuterieItems.meats.serrano_ham"
                    | "charcuterieItems.meats.prosciutto"
                    | "charcuterieItems.meats.salami"
                    | "charcuterieItems.meats.pepperoni"
                    | "charcuterieItems.meats.other"
                    | "charcuterieItems.cheeses.brie"
                    | "charcuterieItems.cheeses.goat_cheese"
                    | "charcuterieItems.cheeses.manchego"
                    | "charcuterieItems.cheeses.parmesan"
                    | "charcuterieItems.cheeses.other"
                    | "charcuterieItems.complements.grapes"
                    | "charcuterieItems.complements.strawberries"
                    | "charcuterieItems.complements.olives"
                    | "charcuterieItems.complements.fig_jam"
                    | "charcuterieItems.complements.artisan_crackers"
                    | "charcuterieItems.complements.other"
                )}
              </span>
            </label>
            {key === "other" && selected.includes("other") && (
              <div className="min-w-0 overflow-hidden pl-6">
                <Input
                  type="text"
                  value={otherValue}
                  onChange={(e) => onOtherChange(e.target.value)}
                  placeholder={otherPlaceholder}
                  className="h-9 w-full min-w-0 text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepSnacks({ tripId, locale, initial }: StepSnacksProps) {
  const t = useTranslations("guest.wizard.snacks");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [snacks, setSnacks] = useState<string[]>(
    normalizeKeys((initial?.snacks as string[]) ?? [], LEGACY_SNACK_MAP)
  );
  const [always, setAlways] = useState<string[]>(
    normalizeKeys((initial?.alwaysOnboard as string[]) ?? [], LEGACY_ALWAYS_MAP)
  );
  const [charcuterie, setCharcuterie] = useState<CharcuterieSelections>(() =>
    parseCharcuterieSelections(initial?.charcuterie_selections)
  );
  const [otherSnack, setOtherSnack] = useState<string>(
    typeof initial?.otherSnack === "string" ? initial.otherSnack : ""
  );
  const [otherAlways, setOtherAlways] = useState<string>(
    typeof initial?.otherAlways === "string" ? initial.otherAlways : ""
  );

  function toggleSnack(value: string) {
    const next = snacks.includes(value) ? snacks.filter((x) => x !== value) : [...snacks, value];
    setSnacks(next);
    if (value === "other" && snacks.includes("other")) {
      setOtherSnack("");
    }
  }

  function toggleAlways(value: string) {
    const next = always.includes(value) ? always.filter((x) => x !== value) : [...always, value];
    setAlways(next);
    if (value === "other" && always.includes("other")) {
      setOtherAlways("");
    }
  }

  function toggleCharcuterie(category: CharcuterieCategory, key: string) {
    setCharcuterie((prev) => {
      const list = prev[category];
      const isRemoving = list.includes(key);
      const nextList = isRemoving ? list.filter((x) => x !== key) : [...list, key];

      if (key === "other" && isRemoving) {
        const otherKey =
          category === "meats"
            ? "otherMeats"
            : category === "cheeses"
              ? "otherCheeses"
              : "otherComplements";
        return { ...prev, [category]: nextList, [otherKey]: null };
      }

      return { ...prev, [category]: nextList };
    });
  }

  function updateCharcuterieOther(
    category: CharcuterieCategory,
    value: string
  ) {
    const otherKey =
      category === "meats"
        ? "otherMeats"
        : category === "cheeses"
          ? "otherCheeses"
          : "otherComplements";
    setCharcuterie((prev) => ({ ...prev, [otherKey]: value }));
  }

  async function persistSnacks() {
    const charcuterieSelections = serializeCharcuterieSelections(charcuterie);
    await saveSnacksStep({
      tripId,
      snacks,
      alwaysOnboard: always,
      charcuterieSelections,
      otherSnack: snacks.includes("other") ? otherSnack.trim() : null,
      otherAlways: always.includes("other") ? otherAlways.trim() : null,
    });
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
            <div className="grid gap-2 sm:grid-cols-2">
              {SNACK_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={snacks.includes(key)}
                      onCheckedChange={() => toggleSnack(key)}
                    />
                    <span>{t(`items.${key}`)}</span>
                  </label>
                  {key === "other" && snacks.includes("other") && (
                    <Input
                      type="text"
                      value={otherSnack}
                      onChange={(e) => setOtherSnack(e.target.value)}
                      placeholder={t("otherPlaceholder")}
                      className="ml-6 h-9 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <Label>{t("alwaysOnboard")}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALWAYS_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={always.includes(key)}
                      onCheckedChange={() => toggleAlways(key)}
                    />
                    <span>{t(`alwaysItems.${key}`)}</span>
                  </label>
                  {key === "other" && always.includes("other") && (
                    <Input
                      type="text"
                      value={otherAlways}
                      onChange={(e) => setOtherAlways(e.target.value)}
                      placeholder={t("alwaysOtherPlaceholder")}
                      className="ml-6 h-9 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 space-y-4 overflow-hidden rounded-xl border border-[#C4A052]/20 bg-[#C4A052]/5 p-5">
            <div>
              <Label className="text-base font-medium text-gray-900">
                {t("charcuterieSectionTitle")}
              </Label>
              <p className="mt-0.5 text-xs text-gray-500">{t("charcuterieHelp")}</p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-2">
              <CharcuterieCheckboxGroup
                title={t("charcuterieMeats")}
                keys={CHARCUTERIE_MEAT_KEYS}
                selected={charcuterie.meats}
                otherValue={charcuterie.otherMeats ?? ""}
                translationPrefix="charcuterieItems.meats"
                onToggle={(key) => toggleCharcuterie("meats", key)}
                onOtherChange={(value) => updateCharcuterieOther("meats", value)}
                otherPlaceholder={t("charcuterieOtherPlaceholder")}
                t={t}
              />
              <CharcuterieCheckboxGroup
                title={t("charcuterieCheeses")}
                keys={CHARCUTERIE_CHEESE_KEYS}
                selected={charcuterie.cheeses}
                otherValue={charcuterie.otherCheeses ?? ""}
                translationPrefix="charcuterieItems.cheeses"
                onToggle={(key) => toggleCharcuterie("cheeses", key)}
                onOtherChange={(value) => updateCharcuterieOther("cheeses", value)}
                otherPlaceholder={t("charcuterieOtherPlaceholder")}
                t={t}
              />
            </div>

            <div className="min-w-0 border-t border-[#C4A052]/15 pt-5">
              <CharcuterieCheckboxGroup
                title={t("charcuterieComplements")}
                keys={CHARCUTERIE_COMPLEMENT_KEYS}
                selected={charcuterie.complements}
                otherValue={charcuterie.otherComplements ?? ""}
                translationPrefix="charcuterieItems.complements"
                onToggle={(key) => toggleCharcuterie("complements", key)}
                onOtherChange={(value) => updateCharcuterieOther("complements", value)}
                otherPlaceholder={t("charcuterieOtherPlaceholder")}
                t={t}
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
