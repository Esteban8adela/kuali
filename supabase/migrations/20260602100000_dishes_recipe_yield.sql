-- Store batch recipe yield (portions) on dishes for edit round-trips
ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS recipe_yield NUMERIC(12, 4) NOT NULL DEFAULT 1
  CHECK (recipe_yield > 0);
