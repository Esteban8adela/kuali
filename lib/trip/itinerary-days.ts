import {
  normalizeDateOnlyInput,
  parseDateOnlyMs,
  formatDateOnlyFromMs,
} from "@/lib/trip/date-validation";

const ONE_DAY_MS = 86_400_000;

/** Inclusive list of YYYY-MM-DD strings from start through end. */
export function buildItineraryDates(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  maxDays = 30
): string[] {
  const startNorm = normalizeDateOnlyInput(startDate);
  const endNorm = normalizeDateOnlyInput(endDate);
  if (!startNorm || !endNorm) return [];

  const startMs = parseDateOnlyMs(startNorm);
  const endMs = parseDateOnlyMs(endNorm);
  if (startMs === null || endMs === null || endMs < startMs) return [];

  const dates: string[] = [];
  let currentMs = startMs;

  while (currentMs <= endMs && dates.length < maxDays) {
    dates.push(formatDateOnlyFromMs(currentMs));
    currentMs += ONE_DAY_MS;
  }

  return dates;
}
