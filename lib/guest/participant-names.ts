export const GENERIC_NAME_PREFIX = "__generic__";

export function genericStoredName(type: "adult" | "child", number: number): string {
  return `${GENERIC_NAME_PREFIX}${type}_${number}`;
}

const LEGACY_ADULT = /^(Guest|Huésped|Huéspedes) \d+$/i;
const LEGACY_CHILD = /^(Child|Niño|Niña) \d+$/i;

export function isUnsetGuestName(name: string | undefined | null): boolean {
  if (!name?.trim()) return true;
  if (name.startsWith(GENERIC_NAME_PREFIX)) return true;
  return LEGACY_ADULT.test(name) || LEGACY_CHILD.test(name);
}

export function resolveParticipantDisplayName(
  name: string,
  type: "adult" | "child",
  number: number,
  locale: string
): string {
  if (isUnsetGuestName(name)) {
    if (locale === "es") return type === "child" ? `Niño ${number}` : `Huésped ${number}`;
    return type === "child" ? `Child ${number}` : `Guest ${number}`;
  }
  return name;
}

export function formatChefGuestDisplayName(
  name: string,
  type: "adult" | "child",
  number: number,
  locale: string
): string {
  if (name.startsWith(GENERIC_NAME_PREFIX)) {
    const suffix = name.slice(GENERIC_NAME_PREFIX.length);
    const match = suffix.match(/^(adult|child)_(\d+)$/);
    if (match) {
      const n = match[2];
      if (locale === "es") {
        return match[1] === "child" ? `Niño ${n}` : `Adulto ${n}`;
      }
      return match[1] === "child" ? `Child ${n}` : `Adult ${n}`;
    }
  }
  if (isUnsetGuestName(name)) {
    if (locale === "es") return type === "child" ? `Niño ${number}` : `Adulto ${number}`;
    return type === "child" ? `Child ${number}` : `Adult ${number}`;
  }
  return name;
}

export function participantGuestNumber(
  participants: Array<{ id: string; participant_type: string; sort_order: number }>,
  participantId: string,
  type: "adult" | "child"
): number {
  const sameType = participants
    .filter((p) => p.participant_type === type)
    .sort((a, b) => a.sort_order - b.sort_order);
  const index = sameType.findIndex((p) => p.id === participantId);
  return index >= 0 ? index + 1 : 1;
}
