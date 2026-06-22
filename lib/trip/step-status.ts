import {
  isKidsMenuConfigValid,
  isMenuItineraryComplete,
  isMenuStepComplete,
  resolveMenuItinerary,
} from "@/lib/guest/menu-itinerary";
import { isPreferenceRecordComplete } from "@/lib/guest/preference-complete";
import { isBarOrderSaved } from "@/lib/trip/bar-order";
import { areTripDatesValid } from "@/lib/trip/date-validation";
import { normalizeBarOrder } from "@/lib/trip/wizard";

export type StepState = "none" | "partial" | "complete";

export interface StepStatus {
  step1: StepState;
  step1Hint?: string;
  step2: StepState;
  step2Hint?: string;
  step3: StepState;
  step3Hint?: string;
  step4: StepState;
  step4Hint?: string;
  step5: StepState;
  step5Hint?: string;
  step6: StepState;
  step6Hint?: string;
}


const BAR_CONTENT_KEYS = [
  "spirits",
  "wines",
  "beers",
  "mixers",
  "specific_bottle_request",
  "chef_recommendation",
  "house_wine_by_glass",
  "bar_saved",
] as const;

function barHasBeverageContent(barOrder: Record<string, unknown>): boolean {
  if (barOrder.bar_saved === true) return true;
  if (typeof barOrder.specific_bottle_request === "string" && barOrder.specific_bottle_request.trim()) {
    return true;
  }
  return BAR_CONTENT_KEYS.filter((k) => k !== "specific_bottle_request" && k !== "bar_saved").some((key) => {
    const val = barOrder[key];
    if (val === undefined || val === null || val === false) return false;
    if (typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as object).length > 0;
    }
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  });
}

interface TripForStepStatus {
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  wizard_step: number;
  status: string;
  bar_order?: unknown;
  menu_order?: unknown;
}

interface ParticipantRow {
  id: string;
  guest_preferences:
    | {
        id: string;
        no_dietary_restrictions?: boolean;
        allergies?: string[];
        dietary_restrictions?: string[];
      }
    | {
        id: string;
        no_dietary_restrictions?: boolean;
        allergies?: string[];
        dietary_restrictions?: string[];
      }[]
    | null;
}

interface MenuSelectionRow {
  selection_type: string;
  custom_notes: string | null;
}

export function computeTripStepStatus(
  trip: TripForStepStatus,
  participants: ParticipantRow[],
  menuSelection: MenuSelectionRow | null,
  locale: string
): StepStatus {
  const stepStatus: StepStatus = {
    step1: "none",
    step2: "none",
    step3: "none",
    step4: "none",
    step5: "none",
    step6: "none",
  };

  const expectedParticipants = trip.adult_count + trip.child_count;
  const participantCount = participants.length;
  const hasValidDates = areTripDatesValid(trip.start_date, trip.end_date);
  const hasParticipants = participantCount > 0 && trip.adult_count > 0;

  if (hasParticipants && hasValidDates) {
    stepStatus.step1 = "complete";
  } else if (hasParticipants || trip.start_date || trip.end_date || trip.adult_count > 0) {
    stepStatus.step1 = "partial";
    if (!trip.start_date || !trip.end_date) {
      stepStatus.step1Hint = locale === "es" ? "Faltan fechas" : "Dates missing";
    } else if (!hasValidDates) {
      stepStatus.step1Hint =
        locale === "es"
          ? "Las fechas no son válidas (inicio antes del fin)"
          : "Invalid dates (start must be before end)";
    } else if (!hasParticipants) {
      stepStatus.step1Hint = locale === "es" ? "Faltan pasajeros" : "Passengers missing";
    }
  }

  if (menuSelection || trip.menu_order) {
    const itinerary = resolveMenuItinerary(trip.menu_order, menuSelection?.custom_notes ?? null);
    if (itinerary.length > 0 && isMenuStepComplete(itinerary)) {
      stepStatus.step2 = "complete";
    } else {
      stepStatus.step2 = "partial";
      if (
        itinerary.length > 0 &&
        isMenuItineraryComplete(itinerary) &&
        !isKidsMenuConfigValid(itinerary)
      ) {
        stepStatus.step2Hint =
          locale === "es" ? "Falta configurar menú infantil" : "Kids menu configuration missing";
      } else if (itinerary.length > 0 && !isMenuItineraryComplete(itinerary)) {
        stepStatus.step2Hint =
          locale === "es"
            ? "Falta desayuno, plato fuerte o cena en algún día"
            : "Missing breakfast, lunch main, or dinner on some days";
      } else {
        stepStatus.step2Hint =
          locale === "es" ? "Faltan configurar comidas" : "Meals still need to be configured";
      }
    }
  }

  const prefsCompleteCount = participants.filter((p) => {
    const prefs = p.guest_preferences;
    const record = Array.isArray(prefs) ? prefs[0] : prefs;
    return isPreferenceRecordComplete(record);
  }).length;

  const prefsTarget = Math.max(expectedParticipants, participantCount);
  const hasAnyPassengers = expectedParticipants > 0 || participantCount > 0;

  if (prefsTarget > 0 && prefsCompleteCount === prefsTarget && participantCount >= expectedParticipants) {
    stepStatus.step3 = "complete";
  } else if (hasAnyPassengers) {
    stepStatus.step3 = "partial";
    const missing = Math.max(0, prefsTarget - prefsCompleteCount);
    if (missing > 0) {
      stepStatus.step3Hint =
        locale === "es"
          ? `Faltan preferencias de ${missing} huésped(es)`
          : `${missing} guest(s) missing preferences`;
    }
  }

  const barOrder = normalizeBarOrder(trip.bar_order);
  const snacksData = barOrder.snacks;

  if (snacksData !== undefined && snacksData !== null && typeof snacksData === "object") {
    stepStatus.step4 = "complete";
  } else if (trip.wizard_step >= 4) {
    stepStatus.step4 = "partial";
    stepStatus.step4Hint = locale === "es" ? "En proceso" : "In progress";
  }

  const isSubmitted = trip.status === "submitted" || trip.status === "active";
  if (isSubmitted || isBarOrderSaved(barOrder) || barHasBeverageContent(barOrder)) {
    stepStatus.step5 = "complete";
  } else if (trip.wizard_step >= 5) {
    stepStatus.step5 = "partial";
    stepStatus.step5Hint = locale === "es" ? "En proceso" : "In progress";
  }

  if (isSubmitted) {
    stepStatus.step6 = "complete";
  } else if (trip.wizard_step >= 6 || stepStatus.step5 === "complete") {
    stepStatus.step6 = "partial";
    stepStatus.step6Hint =
      locale === "es" ? "Revise y confirme su orden" : "Review and confirm your order";
  }

  return stepStatus;
}
