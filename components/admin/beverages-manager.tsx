"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { BEVERAGE_CATEGORIES } from "@/lib/validations/beverage";
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
  const [form, setForm] = useState({
    name_en: "",
    name_es: "",
    category: "spirit",
    subcategory: "",
    base_price: "0",
  });
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ name_en: "", name_es: "", category: "spirit", subcategory: "", base_price: "0" });
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItemRow) {
    setEditing(item);
    setForm({
      name_en: item.name_en,
      name_es: item.name_es,
      category: item.category,
      subcategory: item.subcategory ?? "",
      base_price: String((item.base_price_cents / 100).toFixed(2)),
    });
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name_en: form.name_en.trim(),
      name_es: form.name_es.trim(),
      category: form.category,
      subcategory: form.subcategory.trim() || null,
      base_price_cents: Math.round(Math.max(0, parseFloat(form.base_price) || 0) * 100),
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

  const displayName = (item: CatalogItemRow) =>
    locale === "es" ? item.name_es : item.name_en;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <Button variant="gold" size="lg" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("addButton")}
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-6 py-12 text-center text-neutral-500">{t("empty")}</p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 text-left text-xs uppercase tracking-wider text-neutral-600">
                  <th className="px-4 py-3 font-medium">{t("columns.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("columns.category")}</th>
                  <th className="px-4 py-3 font-medium">{t("columns.subcategory")}</th>
                  <th className="px-4 py-3 font-medium">{t("columns.basePrice")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 hover:bg-[#C4A052]/5">
                    <td className="px-4 py-3 font-medium text-[#1B3A4B]">{displayName(item)}</td>
                    <td className="px-4 py-3">{t(`categories.${item.category}` as "categories.spirit")}</td>
                    <td className="px-4 py-3 text-neutral-600">{item.subcategory ?? "—"}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(centsToUsd(item.base_price_cents), locale)}
                    </td>
                    <td className="px-4 py-3">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
            <DialogDescription>{t("formSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>{t("fields.category")}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BEVERAGE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bev-sub">{t("fields.subcategory")}</Label>
              <Input
                id="bev-sub"
                className="mt-1.5"
                value={form.subcategory}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bev-price">{t("fields.basePrice")}</Label>
              <Input
                id="bev-price"
                type="number"
                min="0"
                step="0.01"
                className="mt-1.5"
                value={form.base_price}
                onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
              />
              <p className="mt-1 text-xs text-neutral-500">
                {t("pricePreview", {
                  price: formatCurrency(parseFloat(form.base_price) || 0, locale),
                })}
              </p>
            </div>
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
