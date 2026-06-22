export interface PreferenceRecord {
  id?: string;
  no_dietary_restrictions?: boolean;
  allergies?: string[];
  dietary_restrictions?: string[];
  general_food_notes?: string[];
}

export function isPreferenceRecordComplete(prefs: PreferenceRecord | null | undefined): boolean {
  if (!prefs?.id) return false;
  if (prefs.no_dietary_restrictions) return true;
  if ((prefs.allergies ?? []).length > 0) return true;
  if ((prefs.dietary_restrictions ?? []).length > 0) return true;
  if ((prefs.general_food_notes ?? []).some((n) => n.trim())) return true;
  return false;
}
