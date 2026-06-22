"use client";

import { useTranslations } from "next-intl";
import type { PriceBreakdownLine } from "@/lib/pricing/calculate-trip-breakdown";
import { formatCurrency, centsToUsd } from "@/lib/utils";

interface OrderPriceBreakdownProps {
  lines: PriceBreakdownLine[];
  locale: string;
}

export function OrderPriceBreakdown({ lines, locale }: OrderPriceBreakdownProps) {
  const t = useTranslations("guest.wizard.overview");

  if (lines.length === 0) return null;

  const totalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);

  return (
    <details className="group mt-4">
      <summary className="cursor-pointer list-none text-sm font-medium text-[#1B3A4B] underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
        {t("priceBreakdownTitle")}
        <span className="ml-1 text-neutral-400 group-open:rotate-90 inline-block transition-transform">
          ›
        </span>
      </summary>
      <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
              <th className="px-3 py-2 font-medium">{t("breakdownConcept")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("breakdownQty")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("breakdownUnit")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("breakdownSubtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.concept}-${index}`} className="border-b border-neutral-100">
                <td className="px-3 py-2 text-neutral-800">{line.concept}</td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                  {line.quantity}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-700">
                  {formatCurrency(centsToUsd(line.unitPriceCents), locale)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-[#1B3A4B]">
                  {formatCurrency(centsToUsd(line.subtotalCents), locale)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#C4A052]/5 font-semibold text-[#1B3A4B]">
              <td className="px-3 py-2" colSpan={3}>
                {t("breakdownTotal")}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(centsToUsd(totalCents), locale)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  );
}
