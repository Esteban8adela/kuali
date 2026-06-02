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
