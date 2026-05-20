"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveMenuSelection, advanceWizardStep } from "@/app/[locale]/(guest)/guest/trip/actions";
import type { Menu, PriceTier } from "@/lib/types/database";

const TIERS: { tier: PriceTier; labelKey: string }[] = [
  { tier: "tier_1", labelKey: "tier1" },
  { tier: "tier_2", labelKey: "tier2" },
  { tier: "tier_3", labelKey: "tier3" },
];

interface StepMenuSelectionProps {
  tripId: string;
  menus: Menu[];
  locale: string;
}

export function StepMenuSelection({ tripId, menus, locale }: StepMenuSelectionProps) {
  const t = useTranslations("guest.wizard.menu");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seasonOnly, setSeasonOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"predefined" | "surprise" | "custom">("predefined");

  const filtered = menus.filter((m) => !seasonOnly || m.is_seasonal);

  function formatPrice(cents: number) {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(cents / 100);
  }

  function handleContinue() {
    startTransition(async () => {
      await saveMenuSelection({
        tripId,
        menuId: mode === "predefined" ? selectedId : null,
        selectionType: mode,
        customNotes: mode === "custom" ? "Custom menu requested" : null,
      });
      await advanceWizardStep(tripId, 3);
      router.push(`/${locale}/guest/trip/${tripId}/preferences`);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-[#C4A052]/20 px-4 py-3">
            <Label htmlFor="season">{t("filterSeason")}</Label>
            <Switch id="season" checked={seasonOnly} onCheckedChange={setSeasonOnly} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "surprise" ? "gold" : "outline"}
              size="sm"
              onClick={() => {
                setMode("surprise");
                setSelectedId(null);
              }}
            >
              {t("surprise")}
            </Button>
            <Button
              type="button"
              variant={mode === "custom" ? "gold" : "outline"}
              size="sm"
              onClick={() => {
                setMode("custom");
                setSelectedId(null);
              }}
            >
              {t("custom")}
            </Button>
          </div>

          {mode === "predefined" &&
            TIERS.map(({ tier, labelKey }) => {
              const tierMenus = filtered.filter((m) => m.price_tier === tier);
              if (!tierMenus.length) return null;
              return (
                <div key={tier} className="space-y-3">
                  <h3 className="font-display text-lg text-[#1B3A4B]">{t(labelKey)}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tierMenus.map((menu) => {
                      const name = locale === "es" ? menu.name_es : menu.name_en;
                      const desc = locale === "es" ? menu.description_es : menu.description_en;
                      const selected = selectedId === menu.id;
                      return (
                        <button
                          key={menu.id}
                          type="button"
                          onClick={() => {
                            setMode("predefined");
                            setSelectedId(menu.id);
                          }}
                          className={cn(
                            "rounded-xl border p-4 text-left transition",
                            selected
                              ? "border-[#C4A052] bg-[#C4A052]/10 ring-2 ring-[#C4A052]/30"
                              : "border-neutral-200 hover:border-[#C4A052]/40"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-display text-lg">{name}</span>
                            {selected && <Badge variant="gold">{t("selected")}</Badge>}
                          </div>
                          {desc && <p className="mt-2 text-sm text-neutral-500">{desc}</p>}
                          <p className="mt-3 text-sm font-medium text-[#1B3A4B]">
                            {formatPrice(menu.price_adult_cents)} / {formatPrice(menu.price_child_cents)} child
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="gold"
          size="lg"
          disabled={pending || (mode === "predefined" && !selectedId)}
          onClick={handleContinue}
        >
          {tc("continue")}
        </Button>
      </div>
    </div>
  );
}
