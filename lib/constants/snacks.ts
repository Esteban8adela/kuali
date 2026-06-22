export const SNACK_CATEGORIES = [
  "chips",
  "candies",
  "healthy",
  "instant",
  "other",
] as const;

export type SnackCategory = (typeof SNACK_CATEGORIES)[number];
