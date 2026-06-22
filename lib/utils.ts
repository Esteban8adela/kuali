import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fixed USD → MXN rate until live FX is wired. */
export const USD_TO_MXN_RATE = 18.5;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `amountUsd` is stored in USD (dollars, not cents). */
export function formatCurrency(amountUsd: number, locale: string): string {
  const safe = Number.isFinite(amountUsd) ? amountUsd : 0;

  if (locale === "es") {
    const mxn = safe * USD_TO_MXN_RATE;
    const formatted = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(mxn);
    return `${formatted} MXN`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return `${formatted} USD`;
}

export function centsToUsd(cents: number): number {
  return (Number.isFinite(cents) ? cents : 0) / 100;
}
