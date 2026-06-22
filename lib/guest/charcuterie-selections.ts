export const CHARCUTERIE_MEAT_KEYS = [
  "serrano_ham",
  "prosciutto",
  "salami",
  "pepperoni",
  "other",
] as const;

export const CHARCUTERIE_CHEESE_KEYS = [
  "brie",
  "goat_cheese",
  "manchego",
  "parmesan",
  "other",
] as const;

export const CHARCUTERIE_COMPLEMENT_KEYS = [
  "grapes",
  "strawberries",
  "olives",
  "fig_jam",
  "artisan_crackers",
  "other",
] as const;

export type CharcuterieMeatKey = (typeof CHARCUTERIE_MEAT_KEYS)[number];
export type CharcuterieCheeseKey = (typeof CHARCUTERIE_CHEESE_KEYS)[number];
export type CharcuterieComplementKey = (typeof CHARCUTERIE_COMPLEMENT_KEYS)[number];

export interface CharcuterieSelections {
  meats: string[];
  cheeses: string[];
  complements: string[];
  otherMeats: string | null;
  otherCheeses: string | null;
  otherComplements: string | null;
}

export function emptyCharcuterieSelections(): CharcuterieSelections {
  return {
    meats: [],
    cheeses: [],
    complements: [],
    otherMeats: null,
    otherCheeses: null,
    otherComplements: null,
  };
}

function filterStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function parseCharcuterieSelections(raw: unknown): CharcuterieSelections {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyCharcuterieSelections();
  }

  const data = raw as Record<string, unknown>;
  return {
    meats: filterStringArray(data.meats),
    cheeses: filterStringArray(data.cheeses),
    complements: filterStringArray(data.complements),
    otherMeats: typeof data.otherMeats === "string" ? data.otherMeats : null,
    otherCheeses: typeof data.otherCheeses === "string" ? data.otherCheeses : null,
    otherComplements: typeof data.otherComplements === "string" ? data.otherComplements : null,
  };
}

export function hasCharcuterieSelections(selections: CharcuterieSelections): boolean {
  return (
    selections.meats.length > 0 ||
    selections.cheeses.length > 0 ||
    selections.complements.length > 0
  );
}

export function serializeCharcuterieSelections(
  selections: CharcuterieSelections
): CharcuterieSelections {
  return {
    meats: selections.meats,
    cheeses: selections.cheeses,
    complements: selections.complements,
    otherMeats: selections.meats.includes("other") ? selections.otherMeats?.trim() || null : null,
    otherCheeses: selections.cheeses.includes("other")
      ? selections.otherCheeses?.trim() || null
      : null,
    otherComplements: selections.complements.includes("other")
      ? selections.otherComplements?.trim() || null
      : null,
  };
}
