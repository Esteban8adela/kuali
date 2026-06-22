-- Allow fractional USD cents for exact MXN ↔ USD round-trips (e.g. 120 MXN → 648.6486… cents)

ALTER TABLE dishes
  ALTER COLUMN base_price_cents TYPE NUMERIC(16, 8) USING base_price_cents::numeric,
  ALTER COLUMN manual_price_cents TYPE NUMERIC(16, 8) USING manual_price_cents::numeric;

ALTER TABLE snacks
  ALTER COLUMN base_price_cents TYPE NUMERIC(16, 8) USING base_price_cents::numeric;

ALTER TABLE catalog_items
  ALTER COLUMN base_price_cents TYPE NUMERIC(16, 8) USING base_price_cents::numeric;

ALTER TABLE charcuterie_items
  ALTER COLUMN base_price_cents TYPE NUMERIC(16, 8) USING base_price_cents::numeric;

ALTER TABLE always_onboard_items
  ALTER COLUMN base_price_cents TYPE NUMERIC(16, 8) USING base_price_cents::numeric;
