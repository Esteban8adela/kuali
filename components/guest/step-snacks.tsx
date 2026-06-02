"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WizardNav } from "@/components/guest/wizard-nav";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { advanceWizardStep, saveDraftAndExit, saveSnacksStep } from "@/app/[locale]/(guest)/guest/trip/actions";

const SNACK_KEYS = ["chips", "maruchan", "mango_snacks", "candies"] as const;
const ALWAYS_KEYS = ["pico_de_gallo", "salsas", "cacahuates", "fruit"] as const;

const LEGACY_SNACK_MAP: Record<string, string> = {
  Papas: "chips",
  Maruchan: "maruchan",
  Manguitos: "mango_snacks",
  Dulces: "candies",
};

const LEGACY_ALWAYS_MAP: Record<string, string> = {
  "Pico de gallo": "pico_de_gallo",
  Salsas: "salsas",
  Cacahuates: "cacahuates",
  Fruta: "fruit",
};

function normalizeKeys(values: string[], legacyMap: Record<string, string>): string[] {
  return values.map((v) => legacyMap[v] ?? v);
}

interface StepSnacksProps {
  tripId: string;
  locale: string;
  initial?: Record<string, unknown>;
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
  const [crudites, setCrudites] = useState<boolean>(Boolean(initial?.crudites));

  const toggle = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const persist = useCallback(async () => {
    await saveSnacksStep({ tripId, snacks, alwaysOnboard: always, crudites });
  }, [tripId, snacks, always, crudites]);

  useWizardAutosave(persist, [snacks, always, crudites]);

  function handleContinue() {
    startTransition(async () => {
      await persist();
      await advanceWizardStep(tripId, 5);
      router.push(`/${locale}/guest/trip/${tripId}/bar`);
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await persist();
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
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <Label>{t("snacksToBuy")}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SNACK_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={snacks.includes(key)}
                    onCheckedChange={() => toggle(key, snacks, setSnacks)}
                  />
                  <span>{t(`items.${key}`)}</span>
                </label>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <Label>{t("alwaysOnboard")}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALWAYS_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={always.includes(key)}
                    onCheckedChange={() => toggle(key, always, setAlways)}
                  />
                  <span>{t(`alwaysItems.${key}`)}</span>
                </label>
              ))}
            </div>
          </section>
          <section className="flex items-center justify-between rounded-xl border border-[#C4A052]/20 bg-[#C4A052]/5 p-4">
            <Label className="text-sm font-medium">{t("crudites")}</Label>
            <Switch checked={crudites} onCheckedChange={setCrudites} />
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
