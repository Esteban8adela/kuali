/** Extract YYYY-MM-DD from date inputs or ISO timestamps (Supabase DATE columns). */
export function normalizeDateOnlyInput(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return match ? match[1] : null;
}

/** Format a local Date as YYYY-MM-DD (never use toISOString for calendar dates). */
export function formatDateOnlyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Coerce client/server values to YYYY-MM-DD or null (safe for Server Actions). */
export function coerceToDateOnlyString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatDateOnlyFromDate(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return normalizeDateOnlyInput(trimmed);
  }
  return null;
}

/** Client → Server Action: always YYYY-MM-DD strings, never Date objects. */
export function formatDateOnlyForPayload(value: string | null | undefined): string | null {
  if (!value) return null;
  return coerceToDateOnlyString(value);
}

/** Compare calendar dates without UTC timezone drift. */
export function parseDateOnlyMs(value: string | null | undefined): number | null {
  const normalized = normalizeDateOnlyInput(value);
  if (!normalized) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);

  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date.getTime();
}

export function formatDateOnlyFromMs(ms: number): string {
  return formatDateOnlyFromDate(new Date(ms));
}

export function areTripDatesValid(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  if (!startDate || !endDate) return false;
  const startMs = parseDateOnlyMs(startDate);
  const endMs = parseDateOnlyMs(endDate);
  if (startMs === null || endMs === null) return false;
  return startMs <= endMs;
}

/** True only when both dates exist and end is before start. */
export function areTripDatesInvalidOrder(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  if (!startDate || !endDate) return false;
  const startMs = parseDateOnlyMs(startDate);
  const endMs = parseDateOnlyMs(endDate);
  if (startMs === null || endMs === null) return false;
  return startMs > endMs;
}
