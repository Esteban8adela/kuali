import { z } from "zod";

export const tripDetailsSchema = z.object({
  tripId: z.string().uuid(),
  adultCount: z.number().int().min(0).max(30),
  childCount: z.number().int().min(0).max(20),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  wizardStep: z.number().int().min(1).max(4).optional(),
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
  dietaryRestrictions: z.array(z.string()),
  proteinPreferences: z.array(z.string()),
  dairyPreferences: z.array(z.string()),
  mealSchedule: z.record(z.string(), z.unknown()),
});

export const barPreferencesSchema = z.object({
  participantId: z.string().uuid(),
  barPreferences: z.record(z.string(), z.unknown()),
});
