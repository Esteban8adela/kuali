-- Phase 2: Inventory & recipe system (Admin / Chef)

-- ---------------------------------------------------------------------------
-- ingredients
-- ---------------------------------------------------------------------------
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit NUMERIC(12, 4) NOT NULL CHECK (cost_per_unit >= 0),
  stock_category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ingredients_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT ingredients_unit_not_blank CHECK (btrim(unit) <> '')
);

CREATE INDEX idx_ingredients_stock_category ON ingredients(stock_category);
CREATE INDEX idx_ingredients_name ON ingredients(name);

CREATE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- dishes
-- ---------------------------------------------------------------------------
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dishes_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT dishes_category_not_blank CHECK (btrim(category) <> '')
);

CREATE INDEX idx_dishes_category ON dishes(category);
CREATE INDEX idx_dishes_name ON dishes(name);

CREATE TRIGGER trg_dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- dish_ingredients (recipe pivot)
-- ---------------------------------------------------------------------------
CREATE TABLE dish_ingredients (
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_per_pax NUMERIC(12, 4) NOT NULL CHECK (quantity_per_pax > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dish_id, ingredient_id)
);

CREATE INDEX idx_dish_ingredients_ingredient ON dish_ingredients(ingredient_id);

CREATE TRIGGER trg_dish_ingredients_updated_at
  BEFORE UPDATE ON dish_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_ingredients ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user
CREATE POLICY ingredients_select ON ingredients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY dishes_select ON dishes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY dish_ingredients_select ON dish_ingredients
  FOR SELECT TO authenticated
  USING (true);

-- Write: admin & chef only
CREATE POLICY ingredients_admin_chef ON ingredients
  FOR ALL TO authenticated
  USING (is_admin_or_chef())
  WITH CHECK (is_admin_or_chef());

CREATE POLICY dishes_admin_chef ON dishes
  FOR ALL TO authenticated
  USING (is_admin_or_chef())
  WITH CHECK (is_admin_or_chef());

CREATE POLICY dish_ingredients_admin_chef ON dish_ingredients
  FOR ALL TO authenticated
  USING (is_admin_or_chef())
  WITH CHECK (is_admin_or_chef());
