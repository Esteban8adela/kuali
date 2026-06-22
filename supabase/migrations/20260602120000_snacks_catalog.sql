-- Standalone snack catalog (not dish course types)

CREATE TABLE IF NOT EXISTS snacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snacks_category ON snacks(category);
CREATE INDEX IF NOT EXISTS idx_snacks_active ON snacks(is_active) WHERE is_active = true;

ALTER TABLE snacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY snacks_select ON snacks FOR SELECT TO authenticated
  USING (is_active = true OR current_user_role() IN ('admin', 'chef'));

CREATE POLICY snacks_admin ON snacks FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');
