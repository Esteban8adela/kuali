"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { saveBarPreferences, advanceWizardStep } from "@/app/[locale]/(guest)/guest/trip/actions";
import type { TripParticipant, GuestPreferences } from "@/lib/types/database";

interface ParticipantWithPrefs extends TripParticipant {
  guest_preferences: GuestPreferences | null;
}

interface StepBarBeveragesProps {
  tripId: string;
  participants: ParticipantWithPrefs[];
  locale: string;
}

export function StepBarBeverages({ tripId, participants, locale }: StepBarBeveragesProps) {
  const t = useTranslations("guest.wizard.bar");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initial = (participants[0]?.guest_preferences?.bar_preferences ?? {}) as Record<
    string,
    boolean | string[]
  >;

  const [natural, setNatural] = useState(Boolean(initial.natural_water));
  const [mineral, setMineral] = useState(Boolean(initial.mineral_water));
  const [sodaRegular, setSodaRegular] = useState(Boolean(initial.soda_regular));
  const [sodaDiet, setSodaDiet] = useState(Boolean(initial.soda_diet));
  const [wineColors, setWineColors] = useState<string[]>((initial.wine_colors as string[]) ?? []);
  const [chefRec, setChefRec] = useState(Boolean(initial.chef_recommendation));
  const [houseGlass, setHouseGlass] = useState(Boolean(initial.house_wine_by_glass));
  const [byob, setByob] = useState(Boolean(initial.byob));

  const wineOptions = [
    { key: "reds", label: t("reds") },
    { key: "whites", label: t("whites") },
    { key: "roses", label: t("roses") },
    { key: "champagne", label: t("champagne") },
  ];

  function toggleWine(key: string) {
    setWineColors((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSubmit() {
    const participantId = participants[0]?.id;
    if (!participantId) return;

    startTransition(async () => {
      await saveBarPreferences({
        participantId,
        barPreferences: {
          natural_water: natural,
          mineral_water: mineral,
          soda_regular: sodaRegular,
          soda_diet: sodaDiet,
          wine_colors: wineColors,
          chef_recommendation: chefRec,
          house_wine_by_glass: houseGlass,
          byob,
        },
      });
      await advanceWizardStep(tripId, 4);
      await supabaseSubmitTrip(tripId);
      router.push(`/${locale}`);
    });
  }

  async function supabaseSubmitTrip(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("trips").update({ status: "submitted" }).eq("id", id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h4 className="mb-3 font-medium text-[#1B3A4B]">{t("waters")}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("natural")}</Label>
                <Switch checked={natural} onCheckedChange={setNatural} />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("mineral")}</Label>
                <Switch checked={mineral} onCheckedChange={setMineral} />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-3 font-medium text-[#1B3A4B]">{t("sodas")}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("regular")}</Label>
                <Switch checked={sodaRegular} onCheckedChange={setSodaRegular} />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("diet")}</Label>
                <Switch checked={sodaDiet} onCheckedChange={setSodaDiet} />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-3 font-medium text-[#1B3A4B]">{t("wines")}</h4>
            <div className="grid grid-cols-2 gap-3">
              {wineOptions.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={wineColors.includes(key)}
                    onCheckedChange={() => toggleWine(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3 border-t border-[#C4A052]/15 pt-6">
            <div className="flex items-center justify-between">
              <Label>{t("chefRecommendation")}</Label>
              <Switch checked={chefRec} onCheckedChange={setChefRec} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("houseByGlass")}</Label>
              <Switch checked={houseGlass} onCheckedChange={setHouseGlass} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("byob")}</Label>
              <Switch checked={byob} onCheckedChange={setByob} />
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gold" size="lg" onClick={handleSubmit} disabled={pending}>
          {tc("save")}
        </Button>
      </div>
    </div>
  );
}
