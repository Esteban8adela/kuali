"use client";

import { useId } from "react";
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
import { X } from "lucide-react";
import type { BarLineSelection, CatalogItem } from "@/lib/catalog/types";
import { catalogLabel } from "@/lib/catalog/utils";

interface CatalogMultiPickerProps {
  title: string;
  items: CatalogItem[];
  selections: BarLineSelection[];
  onChange: (next: BarLineSelection[]) => void;
  locale: string;
  helpText: string;
  addLabel: string;
}

export function CatalogMultiPicker({
  title,
  items,
  selections,
  onChange,
  locale,
  helpText,
  addLabel,
}: CatalogMultiPickerProps) {
  const selectId = useId();
  const available = items.filter(
    (item) => !selections.some((s) => s.catalogItemId === item.id)
  );

  function addItem(catalogItemId: string) {
    const item = items.find((i) => i.id === catalogItemId);
    if (!item) return;
    onChange([
      ...selections,
      {
        catalogItemId: item.id,
        label: catalogLabel(item, locale),
        quantity: null,
      },
    ]);
  }

  function updateQty(index: number, raw: string) {
    const next = [...selections];
    next[index] = {
      ...next[index],
      quantity: raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0),
    };
    onChange(next);
  }

  function remove(index: number) {
    onChange(selections.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium text-[#1B3A4B]">{title}</Label>
      {selections.map((sel, index) => (
        <div
          key={`${sel.catalogItemId}-${index}`}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-[#C4A052]/25 bg-white p-3"
        >
          <span className="min-w-[120px] flex-1 text-sm font-medium text-[#1B3A4B]">
            {sel.label}
          </span>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-neutral-500">Qty</Label>
            <Input
              type="number"
              min={0}
              className="h-9 w-20"
              placeholder="—"
              value={sel.quantity ?? ""}
              onChange={(e) => updateQty(index, e.target.value)}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {available.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      )}
      <p className="text-xs text-neutral-500">{helpText}</p>
    </div>
  );
}
