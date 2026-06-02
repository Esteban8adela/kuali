export const WIZARD_MIN_STEP = 1;
export const WIZARD_MAX_STEP = 5;

export function clampWizardStep(step: number): number {
  const n = Math.round(Number(step));
  if (Number.isNaN(n)) return WIZARD_MIN_STEP;
  return Math.min(WIZARD_MAX_STEP, Math.max(WIZARD_MIN_STEP, n));
}

export function normalizeBarOrder(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) return {};
  if (typeof raw === "string") {
    if (!raw.trim()) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}
