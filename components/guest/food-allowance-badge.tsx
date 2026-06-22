"use client";

import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { calculateFoodAllowanceUsd } from "@/lib/pricing/food-allowance";

export interface FoodAllowanceInput {
  adults: number;
  children: number;
  startDate: string | null;
  endDate: string | null;
}

interface FoodAllowanceBadgeProps {
  input: FoodAllowanceInput;
}

export function FoodAllowanceBadge({ input }: FoodAllowanceBadgeProps) {
  const t = useTranslations("guest.wizard.foodAllowance");
  const total = calculateFoodAllowanceUsd(
    input.adults,
    input.children,
    input.startDate,
    input.endDate
  );

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);

  return (
    <div className="flex max-w-md flex-col items-start gap-0.5 sm:items-end">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#C4A052]/35 bg-[#C4A052]/10 px-3 py-1.5 text-sm font-semibold text-[#1B3A4B] shadow-sm">
        <span>{t("label", { amount: formatted })}</span>
        <InfoTooltip label={t("infoLabel")} content={t("disclaimer")} />
      </div>
      <p className="hidden text-xs text-gray-500 sm:block">{t("disclaimer")}</p>
    </div>
  );
}
