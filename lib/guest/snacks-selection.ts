import { parseCharcuterieSelections, type CharcuterieSelections } from "@/lib/guest/charcuterie-selections";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function filterIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((v): v is string => typeof v === "string" && UUID_RE.test(v));
}

export interface SnacksPayload {
  snackItemIds: string[];
  alwaysOnboardItemIds: string[];
  charcuterie: CharcuterieSelections;
  otherSnack: string | null;
  otherAlways: string | null;
}

export function emptySnacksPayload(): SnacksPayload {
  return {
    snackItemIds: [],
    alwaysOnboardItemIds: [],
    charcuterie: {
      meats: [],
      cheeses: [],
      complements: [],
      otherMeats: null,
      otherCheeses: null,
      otherComplements: null,
    },
    otherSnack: null,
    otherAlways: null,
  };
}

export function parseSnacksPayload(raw: unknown): SnacksPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptySnacksPayload();
  }

  const data = raw as Record<string, unknown>;

  const snackItemIds = filterIds(data.snackItemIds);
  const alwaysOnboardItemIds = filterIds(data.alwaysOnboardItemIds);

  if (snackItemIds.length === 0 && Array.isArray(data.snacks)) {
    // Legacy string keys — no pricing match until admin maps catalog
  }
  if (alwaysOnboardItemIds.length === 0 && Array.isArray(data.alwaysOnboard)) {
    // Legacy
  }

  const charcuterieRaw = data.charcuterie_selections ?? data.charcuterie;
  const charcuterie = parseCharcuterieSelections(charcuterieRaw);

  return {
    snackItemIds,
    alwaysOnboardItemIds,
    charcuterie,
    otherSnack: typeof data.otherSnack === "string" ? data.otherSnack : null,
    otherAlways: typeof data.otherAlways === "string" ? data.otherAlways : null,
  };
}

export function serializeSnacksPayload(payload: SnacksPayload): Record<string, unknown> {
  return {
    snackItemIds: payload.snackItemIds,
    alwaysOnboardItemIds: payload.alwaysOnboardItemIds,
    charcuterie_selections: {
      meats: payload.charcuterie.meats,
      cheeses: payload.charcuterie.cheeses,
      complements: payload.charcuterie.complements,
      otherMeats: payload.charcuterie.otherMeats,
      otherCheeses: payload.charcuterie.otherCheeses,
      otherComplements: payload.charcuterie.otherComplements,
    },
    otherSnack: payload.otherSnack,
    otherAlways: payload.otherAlways,
  };
}
