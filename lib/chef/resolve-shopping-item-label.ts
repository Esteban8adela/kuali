import type { SnacksPayload } from "@/lib/guest/snacks-selection";

const OTHER_RE = /(^other$|_other$|\/other$)/i;

export function isOtherCatalogId(id: string): boolean {
  return OTHER_RE.test(id) || id.toLowerCase() === "other";
}

export function resolveSnackItemLabel(
  id: string,
  parsed: SnacksPayload,
  catalogNames: Record<string, string>
): string {
  if (isOtherCatalogId(id)) {
    return parsed.otherSnack?.trim() || "—";
  }
  return catalogNames[id] ?? id;
}

export function resolveAlwaysOnboardLabel(
  id: string,
  parsed: SnacksPayload,
  catalogNames: Record<string, string>
): string {
  if (isOtherCatalogId(id)) {
    return parsed.otherAlways?.trim() || "—";
  }
  return catalogNames[id] ?? id;
}

export function resolveCharcuterieLabel(
  id: string,
  category: "meats" | "cheeses" | "complements",
  parsed: SnacksPayload,
  catalogNames: Record<string, string>
): string {
  if (isOtherCatalogId(id)) {
    const text =
      category === "meats"
        ? parsed.charcuterie.otherMeats
        : category === "cheeses"
          ? parsed.charcuterie.otherCheeses
          : parsed.charcuterie.otherComplements;
    return text?.trim() || "—";
  }
  return catalogNames[id] ?? id;
}
