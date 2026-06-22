import { z } from "zod";

export const alwaysOnboardItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  base_price_cents: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
  allows_custom_note: z.boolean().optional().default(false),
});

export type AlwaysOnboardItemInput = z.infer<typeof alwaysOnboardItemSchema>;
