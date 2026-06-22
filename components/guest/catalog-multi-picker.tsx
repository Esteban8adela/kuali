"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, X } from "lucide-react";
import type { BarLineSelection, CatalogItem } from "@/lib/catalog/types";
import { catalogLabel } from "@/lib/catalog/utils";
import { GUEST_OTHER_OPTION } from "@/lib/guest/catalog-other";

interface CatalogMultiPickerProps {
  title: string;
  items: CatalogItem[];
  selections: BarLineSelection[];
  onChange: (next: BarLineSelection[]) => void;
  locale: string;
  addLabel: string;
  showOtherOption?: boolean;
  otherLabel?: string;
  otherPlaceholder?: string;
}

function normalizeQuantity(value: number | null | undefined): number {
  if (value == null || value < 1) return 1;
  return value;
}

export function CatalogMultiPicker({
  title,
  items,
  selections,
  onChange,
  locale,
  addLabel,
  showOtherOption = false,
  otherLabel,
  otherPlaceholder,
}: CatalogMultiPickerProps) {
  const selectId = useId();
  const t = useTranslations("guest.wizard.bar");
  const [otherDraft, setOtherDraft] = useState("");
  const hasOther = selections.some((s) => !s.catalogItemId);
  const available = items.filter(
    (item) => !selections.some((s) => s.catalogItemId === item.id)
  );

  function addItem(catalogItemId: string) {
    if (catalogItemId === GUEST_OTHER_OPTION) return;
    const item = items.find((i) => i.id === catalogItemId);
    if (!item) return;
    onChange([
      ...selections,
      {
        catalogItemId: item.id,
        label: catalogLabel(item, locale),
        quantity: 1,
      },
    ]);
  }

  function addOtherLine() {
    const label = otherDraft.trim();
    if (!label || hasOther) return;
    onChange([
      ...selections,
      { catalogItemId: null, label, quantity: 1 },
    ]);
    setOtherDraft("");
  }

  function updateQty(index: number, nextQty: number) {
    const next = [...selections];
    next[index] = {
      ...next[index],
      quantity: Math.max(1, nextQty),
    };
    onChange(next);
  }

  function remove(index: number) {
    onChange(selections.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium text-[#1B3A4B]">{title}</Label>
      {selections.map((sel, index) => {
        const qty = normalizeQuantity(sel.quantity);
        return (
          <div
            key={`${sel.catalogItemId ?? "blank"}-${index}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-[#C4A052]/25 bg-white p-3"
          >
            <span className="min-w-[120px] flex-1 text-sm font-medium text-[#1B3A4B]">
              {sel.label}
            </span>
            <div className="flex items-center gap-1">
              <Label className="sr-only">{t("quantity")}</Label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={qty <= 1}
                onClick={() => updateQty(index, qty - 1)}
                aria-label={t("decreaseQuantity")}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                className="h-9 w-16 text-center"
                value={qty}
                onChange={(e) => updateQty(index, parseInt(e.target.value, 10) || 1)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => updateQty(index, qty + 1)}
                aria-label={t("increaseQuantity")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        {(available.length > 0 || showOtherOption) && (
          <Select onValueChange={addItem}>
            <SelectTrigger className="max-w-xs" id={selectId}>
              <SelectValue placeholder={addLabel} />
            </SelectTrigger>
            <SelectContent>
              {available.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {catalogLabel(item, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showOtherOption && !hasOther ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Input
              type="text"
              value={otherDraft}
              onChange={(e) => setOtherDraft(e.target.value)}
              placeholder={otherPlaceholder ?? "Especifica qué necesitas..."}
              className="max-w-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={addOtherLine} disabled={!otherDraft.trim()}>
              {otherLabel ?? t("addOther")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
