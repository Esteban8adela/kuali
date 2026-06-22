"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatAlternateCurrencyHint,
  localeAmountToUsdCents,
  usdCentsToLocaleAmount,
} from "@/lib/utils";

interface ManualPriceInputProps {
  id?: string;
  label: string;
  locale: string;
  /** USD cents currently stored (manual or effective). */
  usdCents: number;
  value: string;
  onChange: (displayValue: string, usdCents: number) => void;
  disabled?: boolean;
}

export function ManualPriceInput({
  id = "manual-price",
  label,
  locale,
  usdCents,
  value,
  onChange,
  disabled,
}: ManualPriceInputProps) {
  const parsed = parseFloat(value);
  const previewCents = Number.isFinite(parsed)
    ? localeAmountToUsdCents(parsed, locale)
    : usdCents;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step="1"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          const num = parseFloat(next);
          onChange(
            next,
            Number.isFinite(num) ? localeAmountToUsdCents(num, locale) : 0
          );
        }}
        disabled={disabled}
      />
      <p className="text-xs text-neutral-500">
        {formatAlternateCurrencyHint(previewCents, locale)}
      </p>
    </div>
  );
}

export function manualPriceDisplayFromCents(cents: number | null | undefined, locale: string): string {
  if (cents == null || cents <= 0) return "";
  return String(usdCentsToLocaleAmount(cents, locale));
}
