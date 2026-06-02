"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GuestDishOption } from "@/lib/guest/fetch-dishes-catalog";

interface DishMultiPickerProps {
  label: string;
  dishes: GuestDishOption[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function DishMultiPicker({
  label,
  dishes,
  selectedIds,
  onChange,
  disabled,
}: DishMultiPickerProps) {
  const t = useTranslations("guest.wizard.menu");

  function toggle(id: string, checked: boolean) {
    if (checked) {
      onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((item) => item !== id));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium text-[#1B3A4B]">{label}</Label>
        {selectedIds.length > 0 && (
          <span className="text-xs text-neutral-500">
            {t("selectedCount", { count: selectedIds.length })}
          </span>
        )}
      </div>

      {dishes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-4 text-center text-xs text-neutral-500">
          {t("noDishesAvailable")}
        </p>
      ) : (
        <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-[#C4A052]/20 bg-white p-1">
          {dishes.map((dish) => {
            const checked = selectedIds.includes(dish.id);
            return (
              <label
                key={dish.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition",
                  checked ? "bg-[#C4A052]/10" : "hover:bg-[#1B3A4B]/5",
                  disabled && "pointer-events-none opacity-60"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggle(dish.id, value === true)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#1B3A4B]">{dish.name}</span>
                  {dish.description && (
                    <span className="mt-0.5 block text-xs leading-snug text-neutral-500">
                      {dish.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
