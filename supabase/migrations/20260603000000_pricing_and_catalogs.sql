-- Dish & beverage pricing + guest catalog tables

ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS base_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_price_cents >= 0);

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS base_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_price_cents >= 0);

ALTER TABLE snacks
  ADD COLUMN IF NOT EXISTS allows_custom_note BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS charcuterie_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('meats', 'cheeses', 'complements')),
  base_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_price_cents >= 0),
  allows_custom_note BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT charcuterie_items_name_not_blank CHECK (btrim(name) <> '')
);

CREATE INDEX IF NOT EXISTS idx_charcuterie_items_category ON charcuterie_items(category);

CREATE TABLE IF NOT EXISTS always_onboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_price_cents >= 0),
  allows_custom_note BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT always_onboard_items_name_not_blank CHECK (btrim(name) <> '')
);

ALTER TABLE charcuterie_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE always_onboard_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY charcuterie_items_select ON charcuterie_items FOR SELECT TO authenticated
  USING (is_active = true OR current_user_role() IN ('admin', 'chef'));

CREATE POLICY charcuterie_items_admin ON charcuterie_items FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

CREATE POLICY always_onboard_items_select ON always_onboard_items FOR SELECT TO authenticated
  USING (is_active = true OR current_user_role() IN ('admin', 'chef'));

CREATE POLICY always_onboard_items_admin ON always_onboard_items FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- Map legacy kids dishes to lunch main
UPDATE dishes SET category = 'kids_lunch_main' WHERE category = 'kids';
