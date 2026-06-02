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
import { cn } from "@/lib/utils";
import type { GuestDishOption } from "@/lib/guest/fetch-dishes-catalog";

const CLEAR_VALUE = "__none__";

interface DishSinglePickerProps {
  label: string;
  dishes: GuestDishOption[];
  value: string | null;
  onChange: (dishId: string | null) => void;
  required?: boolean;
  optional?: boolean;
}

function hasImageUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

export function DishSinglePicker({
  label,
  dishes,
  value,
  onChange,
  required,
  optional,
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
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#1B3A4B]">
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
          <SelectTrigger>
            <SelectValue placeholder={t("selectDishPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {optional && <SelectItem value={CLEAR_VALUE}>{t("noSelection")}</SelectItem>}
            {dishes.map((dish) => (
              <SelectItem key={dish.id} value={dish.id}>
                {dish.name}
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
            <p className="text-sm font-semibold leading-snug text-[#1B3A4B]">{selected.name}</p>
            {selected.description ? (
              <p className="text-xs leading-relaxed text-neutral-500">{selected.description}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
