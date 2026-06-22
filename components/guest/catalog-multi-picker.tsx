"use client";

import { useId } from "react";
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

interface CatalogMultiPickerProps {
  title: string;
  items: CatalogItem[];
  selections: BarLineSelection[];
  onChange: (next: BarLineSelection[]) => void;
  locale: string;
  addLabel: string;
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
}: CatalogMultiPickerProps) {
  const selectId = useId();
  const t = useTranslations("guest.wizard.bar");

  const catalogSelections = selections.filter((s) => s.catalogItemId);
  const available = items.filter(
    (item) => !catalogSelections.some((s) => s.catalogItemId === item.id)
  );

  function addItem(catalogItemId: string) {
    const item = items.find((i) => i.id === catalogItemId);
    if (!item) return;
    onChange([
      ...catalogSelections,
      {
        catalogItemId: item.id,
        label: catalogLabel(item, locale),
        quantity: 1,
      },
    ]);
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
            key={`${sel.catalogItemId ?? "custom"}-${index}`}
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
                step="1"
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

      {available.length > 0 ? (
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
      ) : null}
    </div>
  );
}

interface SpiritCustomBrandsProps {
  title: string;
  catalogItems: CatalogItem[];
  catalogSelections: BarLineSelection[];
  customBrands: string[];
  onCatalogChange: (next: BarLineSelection[]) => void;
  onCustomBrandsChange: (next: string[]) => void;
  locale: string;
  addLabel: string;
}

export function SpiritCategoryPicker({
  title,
  catalogItems,
  catalogSelections,
  customBrands,
  onCatalogChange,
  onCustomBrandsChange,
  locale,
  addLabel,
}: SpiritCustomBrandsProps) {
  const t = useTranslations("guest.wizard.bar");

  return (
    <div className="space-y-3">
      <CatalogMultiPicker
        title={title}
        items={catalogItems}
        selections={catalogSelections}
        onChange={onCatalogChange}
        locale={locale}
        addLabel={addLabel}
      />

      <div className="mt-2 w-full space-y-2">
        {customBrands.map((brand, index) => (
          <div key={`custom-${index}`} className="flex w-full items-center gap-2">
            <Input
              type="text"
              value={brand}
              placeholder={t("customBrandPlaceholder")}
              onChange={(e) => {
                const next = [...customBrands];
                next[index] = e.target.value;
                onCustomBrandsChange(next);
              }}
              className="w-full"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onCustomBrandsChange(customBrands.filter((_, i) => i !== index))}
              aria-label={t("removeCustomBrand")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 w-full text-left text-sm font-medium text-[#C4A052] hover:text-[#1B3A4B] hover:underline"
          onClick={() => onCustomBrandsChange([...customBrands, ""])}
        >
          {t("addCustomBrand")}
        </button>
      </div>
    </div>
  );
}
