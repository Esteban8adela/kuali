"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import type { TripStockLine } from "@/lib/types/database";

interface StockTableProps {
  tripId: string;
  lines: TripStockLine[];
}

export function StockTable({ tripId, lines: initial }: StockTableProps) {
  const t = useTranslations("chef");
  const locale = useLocale();
  const [lines, setLines] = useState(initial);

  async function updateConsumed(lineId: string, value: number) {
    const supabase = createClient();
    await supabase.from("trip_stock_lines").update({ consumed_qty: value }).eq("id", lineId);
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              consumed_qty: value,
              chargeable_qty: value,
              line_total_cents: value * l.unit_price_cents,
            }
          : l
      )
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#C4A052]/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-[#1B3A4B] text-left text-white">
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">{t("initial")}</th>
            <th className="px-4 py-3">{t("consumed")}</th>
            <th className="px-4 py-3">{t("chargeable")}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const name =
              locale === "es"
                ? line.stock_items?.name_es
                : line.stock_items?.name_en;
            return (
              <tr key={line.id} className="border-b border-neutral-100">
                <td className="px-4 py-3 font-mono text-xs">{line.stock_items?.sku}</td>
                <td className="px-4 py-3">{name}</td>
                <td className="px-4 py-3">{line.initial_qty}</td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    defaultValue={line.consumed_qty ?? ""}
                    onBlur={(e) => updateConsumed(line.id, Number(e.target.value) || 0)}
                  />
                </td>
                <td className="px-4 py-3 font-medium">
                  {line.chargeable_qty} · ${(line.line_total_cents / 100).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
