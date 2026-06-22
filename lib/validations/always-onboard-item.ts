import { z } from "zod";

export const alwaysOnboardItemSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_es: z.string().trim().min(1, "Spanish name is required"),
  base_price_cents: z.coerce.number().min(0),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
  allows_custom_note: z.boolean().optional().default(false),
});

export type AlwaysOnboardItemInput = z.infer<typeof alwaysOnboardItemSchema>;
