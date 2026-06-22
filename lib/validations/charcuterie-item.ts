import { z } from "zod";

export const CHARCUTERIE_CATEGORIES = ["meats", "cheeses", "complements"] as const;

export const charcuterieItemSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_es: z.string().trim().min(1, "Spanish name is required"),
  category: z.enum(CHARCUTERIE_CATEGORIES),
  base_price_cents: z.coerce.number().min(0),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
  allows_custom_note: z.boolean().optional().default(false),
});

export type CharcuterieItemInput = z.infer<typeof charcuterieItemSchema>;
