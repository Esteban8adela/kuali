import { z } from "zod";

export const tripDetailsSchema = z.object({
  tripId: z.string().uuid(),
  adultCount: z.number().int().min(0).max(30),
  childCount: z.number().int().min(0).max(20),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  wizardStep: z.number().int().min(1).max(5).optional(),
  adultNames: z.array(z.string()).optional(),
  childNames: z.array(z.string()).optional(),
})
  .refine((d) => d.adultCount + d.childCount >= 1, {
    message: "At least one guest required",
  })
  .refine(
    (d) => {
      if (!d.startDate || !d.endDate) return true;
      return new Date(d.endDate) >= new Date(d.startDate);
    },
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
          kidsMenu: z.boolean().optional(),
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
