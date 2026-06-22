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
import {
  ManualPriceInput,
  manualPriceDisplayFromCents,
} from "@/components/admin/manual-price-input";
import { formatCurrency, centsToUsd } from "@/lib/utils";

interface CatalogRow {
  id: string;
  name: string;
  category?: string;
  base_price_cents: number;
}

type CatalogI18n =
  | "admin.charcuterie"
  | "admin.alwaysOnboard"
  | "admin.snacks";

interface NamedCatalogManagerProps {
  items: CatalogRow[];
  locale: string;
  i18nNamespace: CatalogI18n;
  categories?: readonly string[];
  embedded?: boolean;
  defaultCategory?: string;
  onCreate: (input: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, input: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function NamedCatalogManager({
  items,
  locale,
  i18nNamespace,
  categories,
  embedded = false,
  defaultCategory,
  onCreate,
  onUpdate,
  onDelete,
}: NamedCatalogManagerProps) {
  const t = useTranslations(i18nNamespace);
  const tc = useTranslations("common");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? categories?.[0] ?? "");
  const [priceDisplay, setPriceDisplay] = useState("0");
  const [priceUsdCents, setPriceUsdCents] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const priceLabel =
    locale === "es" ? t("fields.manualPriceMxn") : t("fields.manualPriceUsd");

  function openCreate() {
    setEditing(null);
    setName("");
    setCategory(defaultCategory ?? categories?.[0] ?? "");
    setPriceDisplay("0");
    setPriceUsdCents(0);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(item: CatalogRow) {
    setEditing(item);
    setName(item.name);
    setCategory(item.category ?? defaultCategory ?? categories?.[0] ?? "");
    const display = manualPriceDisplayFromCents(item.base_price_cents, locale);
    setPriceDisplay(display || "0");
    setPriceUsdCents(item.base_price_cents);
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      category: defaultCategory ?? category,
      base_price_cents: priceUsdCents,
    };

    startTransition(async () => {
      try {
        if (editing) await onUpdate(editing.id, payload);
        else await onCreate(payload);
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
      await onDelete(id);
      router.refresh();
    });
  }

  const table = (
    <Card className={embedded ? "border-0 shadow-none" : "border-0 shadow-sm"}>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-6 py-8 text-center text-neutral-500">{t("empty")}</p>
        ) : (
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 text-left text-xs uppercase tracking-wider text-neutral-600">
                <th className="px-4 py-3 font-medium">{t("columns.name")}</th>
                {categories && !defaultCategory ? (
                  <th className="px-4 py-3 font-medium">{t("columns.category")}</th>
                ) : null}
                <th className="px-4 py-3 font-medium">{t("columns.basePrice")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 hover:bg-[#C4A052]/5">
                  <td className="px-4 py-3 font-medium text-[#1B3A4B]">{item.name}</td>
                  {categories && !defaultCategory ? (
                    <td className="px-4 py-3">
                      {item.category
                        ? t(`categories.${item.category}` as "categories.meats")
                        : "—"}
                    </td>
                  ) : null}
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
  );

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded ? (
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
      ) : (
        <div className="flex justify-end">
          <Button variant="gold" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("addButton")}
          </Button>
        </div>
      )}

      {table}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
            <DialogDescription>{t("formSubtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="item-name">{t("fields.name")}</Label>
              <Input
                id="item-name"
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {categories && !defaultCategory ? (
              <div>
                <Label>{t("fields.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`categories.${cat}` as "categories.meats")}
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
