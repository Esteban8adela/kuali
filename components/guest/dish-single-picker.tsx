"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequiredMark } from "@/components/ui/required-mark";
import { cn, formatCurrency, centsToUsd } from "@/lib/utils";
import type { GuestDishOption } from "@/lib/guest/fetch-dishes-catalog";

const CLEAR_VALUE = "__none__";

interface DishSinglePickerProps {
  label: string;
  dishes: GuestDishOption[];
  value: string | null;
  onChange: (dishId: string | null) => void;
  locale: string;
  required?: boolean;
  optional?: boolean;
  compact?: boolean;
}

function hasImageUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

export function DishSinglePicker({
  label,
  dishes,
  value,
  onChange,
  locale,
  required,
  optional,
  compact,
}: DishSinglePickerProps) {
  const t = useTranslations("guest.wizard.menu");
  const selected = value ? dishes.find((d) => d.id === value) ?? null : null;
  const showImage = selected ? hasImageUrl(selected.image_url) : false;

  const selectValue =
    value && dishes.some((d) => d.id === value)
      ? value
      : optional
        ? CLEAR_VALUE
        : undefined;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && !optional ? <RequiredMark /> : null}
        {optional ? (
          <span className="ml-1 text-xs font-normal text-neutral-500">({t("optional")})</span>
        ) : null}
      </Label>

      {dishes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-3 text-center text-xs text-neutral-500">
          {t("noDishesAvailable")}
        </p>
      ) : (
        <Select
          value={selectValue}
          onValueChange={(v) => onChange(v === CLEAR_VALUE ? null : v)}
        >
          <SelectTrigger className={compact ? "h-9" : undefined}>
            <SelectValue placeholder={t("selectDishPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {optional && <SelectItem value={CLEAR_VALUE}>{t("noSelection")}</SelectItem>}
            {dishes.map((dish) => (
              <SelectItem key={dish.id} value={dish.id}>
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{dish.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                    {formatCurrency(centsToUsd(dish.base_price_cents), locale)}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selected && (
        <div
          className={cn(
            "h-auto overflow-hidden rounded-lg border border-[#C4A052]/25 bg-white shadow-sm",
            showImage ? "" : "px-3.5 py-3"
          )}
        >
          {showImage && selected.image_url && (
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={selected.image_url}
                alt={selected.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
                unoptimized
              />
            </div>
          )}
          <div className={cn("space-y-1", showImage && "p-3")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug text-[#1B3A4B]">{selected.name}</p>
              <span className="shrink-0 rounded-md bg-[#C4A052]/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#1B3A4B]">
                {formatCurrency(centsToUsd(selected.base_price_cents), locale)}
              </span>
            </div>
            {selected.description ? (
              <p className="text-xs leading-relaxed text-neutral-500">{selected.description}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
