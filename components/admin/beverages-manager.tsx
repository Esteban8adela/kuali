"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BEVERAGE_CATEGORY_KEYS, SPIRIT_SUBCATEGORIES } from "@/lib/constants/beverages";
import { sortBeverages } from "@/lib/catalog/utils";
import {
  ManualPriceInput,
  manualPriceDisplayFromCents,
} from "@/components/admin/manual-price-input";
import {
  createBeverage,
  deleteBeverage,
  updateBeverage,
} from "@/app/[locale]/(admin)/admin/beverages/actions";
import type { CatalogItemRow } from "@/lib/types/database";
import { formatCurrency, centsToUsd } from "@/lib/utils";

interface BeveragesManagerProps {
  items: CatalogItemRow[];
  locale: string;
}

export function BeveragesManager({ items, locale }: BeveragesManagerProps) {
  const t = useTranslations("admin.beverages");
  const tc = useTranslations("common");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItemRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name_en: "",
    name_es: "",
    description_en: "",
    description_es: "",
    presentation: "",
    category: "spirit",
    subcategory: SPIRIT_SUBCATEGORIES[0] as string,
  });
  const [priceDisplay, setPriceDisplay] = useState("0");
  const [priceUsdCents, setPriceUsdCents] = useState(0);

  const priceLabel = t("fields.basePriceUnit");

  function openCreate(category = "spirit") {
    setEditing(null);
    setForm({
      name_en: "",
      name_es: "",
      description_en: "",
      description_es: "",
      presentation: "",
      category,
      subcategory: category === "spirit" ? SPIRIT_SUBCATEGORIES[0] : "",
    });
    setPriceDisplay("0");
    setPriceUsdCents(0);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItemRow) {
    setEditing(item);
    setForm({
      name_en: item.name_en,
      name_es: item.name_es,
      description_en: item.description_en ?? "",
      description_es: item.description_es ?? "",
      presentation: item.presentation ?? "",
      category: item.category,
      subcategory: item.subcategory ?? (item.category === "spirit" ? SPIRIT_SUBCATEGORIES[0] : ""),
    });
    const display = manualPriceDisplayFromCents(item.base_price_cents, locale);
    setPriceDisplay(display || "0");
    setPriceUsdCents(item.base_price_cents);
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name_en: form.name_en.trim(),
      name_es: form.name_es.trim(),
      description_en: form.description_en.trim() || null,
      description_es: form.description_es.trim() || null,
      presentation: form.presentation.trim() || null,
      category: form.category,
      subcategory: form.category === "spirit" ? form.subcategory : null,
      base_price_cents: priceUsdCents,
    };

    startTransition(async () => {
      try {
        if (editing) await updateBeverage(editing.id, payload);
        else await createBeverage(payload);
        setDialogOpen(false);
        router.refresh();
      } catch {
        setError(t("saveError"));
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteBeverage(id);
      router.refresh();
    });
  }

  const displayName = (item: CatalogItemRow) => {
    const name = locale === "es" ? item.name_es : item.name_en;
    return item.presentation?.trim() ? `${name} (${item.presentation.trim()})` : name;
  };

  const sectionMeta: Record<string, { title: string; desc: string }> = {
    spirit: { title: t("sections.spirits"), desc: t("sections.spiritsDesc") },
    mixer: { title: t("sections.mixers"), desc: t("sections.mixersDesc") },
    beer: { title: t("sections.beers"), desc: t("sections.beersDesc") },
    wine: { title: t("sections.wines"), desc: t("sections.winesDesc") },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6">
        {BEVERAGE_CATEGORY_KEYS.map((cat) => {
          const sectionItems = sortBeverages(items.filter((i) => i.category === cat));
          const meta = sectionMeta[cat];
          return (
            <Card key={cat} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{meta.title}</CardTitle>
                  <CardDescription>{meta.desc}</CardDescription>
                </div>
                <Button variant="gold" size="sm" onClick={() => openCreate(cat)}>
                  <Plus className="h-4 w-4" />
                  {t("addButton")}
                </Button>
              </CardHeader>
              <CardContent className="p-0 pb-4">
                {sectionItems.length === 0 ? (
                  <p className="px-6 py-6 text-center text-sm text-neutral-500">{t("empty")}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 text-left text-xs uppercase text-neutral-600">
                        <th className="px-4 py-2 font-medium">{t("columns.name")}</th>
                        {cat === "spirit" ? (
                          <th className="px-4 py-2 font-medium">{t("columns.subcategory")}</th>
                        ) : null}
                        <th className="px-4 py-2 font-medium">{t("columns.basePrice")}</th>
                        <th className="px-4 py-2 text-right font-medium">{t("columns.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionItems.map((item) => (
                        <tr key={item.id} className="border-b border-neutral-100">
                          <td className="px-4 py-2.5 font-medium">{displayName(item)}</td>
                          {cat === "spirit" ? (
                            <td className="px-4 py-2.5 text-neutral-600">
                              {item.subcategory
                                ? t(`spiritTypes.${item.subcategory}` as "spiritTypes.rum")
                                : "—"}
                            </td>
                          ) : null}
                          <td className="px-4 py-2.5">
                            {formatCurrency(centsToUsd(item.base_price_cents), locale)}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                disabled={pending}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
            <DialogDescription>{t("formSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bev-name-es">{t("fields.nameEs")}</Label>
              <Input
                id="bev-name-es"
                className="mt-1.5"
                value={form.name_es}
                onChange={(e) => setForm((f) => ({ ...f, name_es: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="bev-name-en">{t("fields.nameEn")}</Label>
              <Input
                id="bev-name-en"
                className="mt-1.5"
                value={form.name_en}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="bev-desc-es">{t("fields.descriptionEs")}</Label>
              <textarea
                id="bev-desc-es"
                className="mt-1.5 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.description_es}
                onChange={(e) => setForm((f) => ({ ...f, description_es: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="bev-desc-en">{t("fields.descriptionEn")}</Label>
              <textarea
                id="bev-desc-en"
                className="mt-1.5 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.description_en}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="bev-presentation">{t("fields.presentation")}</Label>
              <Input
                id="bev-presentation"
                className="mt-1.5"
                placeholder="750ml"
                value={form.presentation}
                onChange={(e) => setForm((f) => ({ ...f, presentation: e.target.value }))}
              />
            </div>
            {form.category === "spirit" ? (
              <div>
                <Label>{t("fields.spiritType")}</Label>
                <Select
                  value={form.subcategory}
                  onValueChange={(v) => setForm((f) => ({ ...f, subcategory: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPIRIT_SUBCATEGORIES.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {t(`spiritTypes.${sub}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <ManualPriceInput
              label={priceLabel}
              locale={locale}
              usdCents={priceUsdCents}
              value={priceDisplay}
              onChange={(display, cents) => {
                setPriceDisplay(display);
                setPriceUsdCents(cents);
              }}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tc("back")}
              </Button>
              <Button type="submit" variant="gold" disabled={pending}>
                {pending ? tc("saving") : tc("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
