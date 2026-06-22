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
import { formatCurrency, centsToUsd } from "@/lib/utils";

interface CatalogRow {
  id: string;
  name: string;
  category?: string;
  base_price_cents: number;
}

interface NamedCatalogManagerProps {
  items: CatalogRow[];
  locale: string;
  i18nNamespace: "admin.charcuterie" | "admin.alwaysOnboard";
  categories?: readonly string[];
  onCreate: (input: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, input: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function NamedCatalogManager({
  items,
  locale,
  i18nNamespace,
  categories,
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
  const [category, setCategory] = useState(categories?.[0] ?? "");
  const [basePrice, setBasePrice] = useState("0");
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setCategory(categories?.[0] ?? "");
    setBasePrice("0");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(item: CatalogRow) {
    setEditing(item);
    setName(item.name);
    setCategory(item.category ?? categories?.[0] ?? "");
    setBasePrice(String((item.base_price_cents / 100).toFixed(2)));
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      category: categories ? category : undefined,
      base_price_cents: Math.round(Math.max(0, parseFloat(basePrice) || 0) * 100),
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
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 text-left text-xs uppercase tracking-wider text-neutral-600">
                  <th className="px-4 py-3 font-medium">{t("columns.name")}</th>
                  {categories ? (
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
                    {categories ? (
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
            {categories ? (
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
            <div>
              <Label htmlFor="item-price">{t("fields.basePrice")}</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                className="mt-1.5"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
              <p className="mt-1 text-xs text-neutral-500">
                {t("pricePreview", {
                  price: formatCurrency(parseFloat(basePrice) || 0, locale),
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
