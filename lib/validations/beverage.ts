import { z } from "zod";

export const BEVERAGE_CATEGORIES = ["spirit", "wine", "beer", "mixer"] as const;

export const beverageSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_es: z.string().trim().min(1, "Spanish name is required"),
  category: z.enum(BEVERAGE_CATEGORIES),
  subcategory: z.string().trim().optional().nullable(),
  base_price_cents: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export type BeverageInput = z.infer<typeof beverageSchema>;
