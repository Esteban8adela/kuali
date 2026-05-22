import { z } from "zod";

export const tripDetailsSchema = z.object({
  tripId: z.string().uuid(),
  adultCount: z.number().int().min(0).max(30),
  childCount: z.number().int().min(0).max(20),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  wizardStep: z.number().int().min(1).max(4).optional(),
  adultNames: z.array(z.string()).optional(),
  childNames: z.array(z.string()).optional(),
}).refine((d) => d.adultCount + d.childCount >= 1, {
  message: "At least one guest required",
});

export const menuSelectionSchema = z.object({
  tripId: z.string().uuid(),
  menuId: z.string().uuid().optional().nullable(),
  selectionType: z.enum(["predefined", "surprise", "custom"]),
  customNotes: z.string().optional().nullable(),
});

export const guestPreferencesSchema = z.object({
  participantId: z.string().uuid(),
  allergies: z.array(z.string()),
  allergiesOther: z.string().optional(),
  dietaryRestrictions: z.array(z.string()),
  proteinPreferences: z.array(z.string()),
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
