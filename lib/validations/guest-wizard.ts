import { z } from "zod";
import {
  areTripDatesInvalidOrder,
  coerceToDateOnlyString,
} from "@/lib/trip/date-validation";
import { MAX_TRIP_GUESTS } from "@/lib/constants/trip";

const dateOnlyField = z.preprocess(
  (val) => coerceToDateOnlyString(val),
  z.string().nullable().optional()
);

export const tripDetailsSchema = z.object({
  tripId: z.string().uuid(),
  adultCount: z.number().int().min(0).max(30),
  childCount: z.number().int().min(0).max(20),
  startDate: dateOnlyField,
  endDate: dateOnlyField,
  wizardStep: z.number().int().min(1).max(5).optional(),
  adultNames: z.array(z.string()).optional(),
  childNames: z.array(z.string()).optional(),
})
  .refine((d) => d.adultCount + d.childCount >= 1, {
    message: "At least one guest required",
  })
  .refine((d) => d.adultCount + d.childCount <= MAX_TRIP_GUESTS, {
    message: `Maximum ${MAX_TRIP_GUESTS} guests allowed`,
  })
  .refine(
    (d) => !areTripDatesInvalidOrder(d.startDate, d.endDate),
    { message: "End date cannot be before start date" }
  );

export const menuSelectionSchema = z.object({
  tripId: z.string().uuid(),
  menuId: z.string().uuid().optional().nullable(),
  selectionType: z.enum(["custom"]),
  customNotes: z.string().optional().nullable(),
  itinerary: z.array(
    z.object({
      date: z.string(),
      meals: z.array(
        z.object({
          key: z.string(),
          heaviness: z.string().nullable().optional(),
          kidsMenuCount: z.number().int().min(0).optional(),
          kidsMenuNotes: z.string().nullable().optional(),
          selected_dish_id: z.string().uuid().nullable().optional(),
          selected_appetizer_id: z.string().uuid().nullable().optional(),
          selected_main_id: z.string().uuid().nullable().optional(),
          selected_dessert_id: z.string().uuid().nullable().optional(),
          selected_kids_dish_id: z.string().uuid().nullable().optional(),
          kidsMenu: z.boolean().optional(),
          selected_dishes: z.array(z.string().uuid()).optional(),
          selected_appetizers: z.array(z.string().uuid()).optional(),
          selected_mains: z.array(z.string().uuid()).optional(),
          dishes: z.array(z.string()).optional(),
        })
      ),
    })
  ),
});

export const guestPreferencesSchema = z.object({
  participantId: z.string().uuid(),
  noDietaryRestrictions: z.boolean(),
  allergies: z.array(z.string()),
  allergiesOther: z.string().optional(),
  dietaryRestrictions: z.array(z.string()),
  proteinPreferences: z.array(z.string()),
  generalFoodNotes: z.array(z.string()).optional(),
  dairyPreferences: z.array(z.string()).optional(),
});

export const globalMealScheduleSchema = z.object({
  tripId: z.string().uuid(),
  mealSchedule: z.record(z.string(), z.unknown()),
});

export const barLineSchema = z.object({
  catalogItemId: z.string().nullable(),
  label: z.string(),
  quantity: z.number().nullable(),
});

export const finalizeTripSchema = z.object({
  tripId: z.string().uuid(),
  barOrder: z.record(z.string(), z.unknown()),
});
