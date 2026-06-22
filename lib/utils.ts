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

/** Convert locale display amount to USD cents for DB storage. */
export function localeAmountToUsdCents(amount: number, locale: string): number {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (locale === "es") {
    return Math.round((safe / USD_TO_MXN_RATE) * 100);
  }
  return Math.round(safe * 100);
}

/** Convert USD cents to amount shown in the admin price input for the locale. */
export function usdCentsToLocaleAmount(cents: number, locale: string): number {
  const usd = centsToUsd(cents);
  return locale === "es" ? usd * USD_TO_MXN_RATE : usd;
}

/** Format a hint string for the alternate currency (~ $X.XX USD / MXN). */
export function formatAlternateCurrencyHint(usdCents: number, locale: string): string {
  const usd = centsToUsd(usdCents);
  if (locale === "es") {
    return `~ ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd)} USD`;
  }
  const mxn = usd * USD_TO_MXN_RATE;
  return `~ ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(mxn)} MXN`;
}
