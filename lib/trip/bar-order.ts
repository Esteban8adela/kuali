export function isBarOrderSaved(barOrder: Record<string, unknown>): boolean {
  if (barOrder.bar_saved === true) return true;
  const keys = Object.keys(barOrder).filter((k) => k !== "snacks");
  return keys.length > 0;
}
