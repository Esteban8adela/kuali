-- Manual price override for dishes (USD cents); base_price_cents remains the effective sell price
ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS manual_price_cents INTEGER NULL
  CHECK (manual_price_cents IS NULL OR manual_price_cents >= 0);
