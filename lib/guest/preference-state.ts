import type { GuestPreferences } from "@/lib/types/database";

export const ALLERGY_OPTIONS = [
  "gluten",
  "dairy",
  "shellfish",
  "nuts",
  "eggs",
  "soy",
  "fish",
  "other",
] as const;

export type AllergyOption = (typeof ALLERGY_OPTIONS)[number];

export interface ParticipantPreferenceForm {
  noRestrictions: boolean;
  allergies: AllergyOption[];
  allergiesOther: string;
  dietStyle: string;
  additionalComments: string;
}

export function parseAllergiesFromDb(raw: string[]): {
  allergies: AllergyOption[];
  allergiesOther: string;
} {
  const allergies: AllergyOption[] = [];
  let allergiesOther = "";

  for (const item of raw) {
    if (item.startsWith("other:")) {
      allergiesOther = item.slice(6);
      if (!allergies.includes("other")) allergies.push("other");
    } else if (ALLERGY_OPTIONS.includes(item as AllergyOption)) {
      allergies.push(item as AllergyOption);
    }
  }

  return { allergies, allergiesOther };
}

export function buildPreferenceState(
  prefs: GuestPreferences | null
): ParticipantPreferenceForm {
  const { allergies, allergiesOther } = parseAllergiesFromDb(prefs?.allergies ?? []);
  return {
    noRestrictions: Boolean(prefs?.no_dietary_restrictions),
    allergies,
    allergiesOther,
    dietStyle: prefs?.dietary_restrictions?.[0] ?? "",
    additionalComments: prefs?.general_food_notes?.[0] ?? "",
  };
}

export function emptyPreferenceState(): ParticipantPreferenceForm {
  return {
    noRestrictions: false,
    allergies: [],
    allergiesOther: "",
    dietStyle: "",
    additionalComments: "",
  };
}
