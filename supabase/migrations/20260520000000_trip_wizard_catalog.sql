-- Trip-level wizard data + bar catalog for admin-managed dropdowns

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS global_meal_schedule JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bar_order JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON catalog_items(is_active) WHERE is_active = true;

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_items_select ON catalog_items FOR SELECT TO authenticated
  USING (is_active = true OR current_user_role() IN ('admin', 'chef'));
CREATE POLICY catalog_items_admin ON catalog_items FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- Seed catalog (replaceable by admin CRUD later)
INSERT INTO catalog_items (category, subcategory, name_en, name_es, sort_order) VALUES
-- Tequila
('spirit', 'tequila', 'Don Julio 1942', 'Don Julio 1942', 1),
('spirit', 'tequila', 'Casa Dragones', 'Casa Dragones', 2),
('spirit', 'tequila', 'Clase Azul', 'Clase Azul', 3),
('spirit', 'tequila', 'Patrón Silver', 'Patrón Silver', 4),
-- Rum
('spirit', 'rum', 'Zacapa 23', 'Zacapa 23', 1),
('spirit', 'rum', 'Diplomático Reserva', 'Diplomático Reserva', 2),
('spirit', 'rum', 'Bacardi Ocho', 'Bacardi Ocho', 3),
-- Vodka
('spirit', 'vodka', 'Grey Goose', 'Grey Goose', 1),
('spirit', 'vodka', 'Belvedere', 'Belvedere', 2),
('spirit', 'vodka', 'Ketel One', 'Ketel One', 3),
-- Gin
('spirit', 'gin', 'Hendrick''s', 'Hendrick''s', 1),
('spirit', 'gin', 'Tanqueray No. Ten', 'Tanqueray No. Ten', 2),
('spirit', 'gin', 'Bombay Sapphire', 'Bombay Sapphire', 3),
-- Mezcal
('spirit', 'mezcal', 'Del Maguey Vida', 'Del Maguey Vida', 1),
('spirit', 'mezcal', 'Montelobos', 'Montelobos', 2),
-- Whiskey
('spirit', 'whiskey', 'Macallan 12', 'Macallan 12', 1),
('spirit', 'whiskey', 'Johnnie Walker Blue', 'Johnnie Walker Blue', 2),
('spirit', 'whiskey', 'Woodford Reserve', 'Woodford Reserve', 3),
-- Wine regions
('wine', 'region', 'Napa Valley Cabernet', 'Cabernet de Napa', 1),
('wine', 'region', 'Burgundy Chardonnay', 'Chardonnay de Borgoña', 2),
('wine', 'region', 'Rioja Reserva', 'Rioja Reserva', 3),
('wine', 'region', 'Provence Rosé', 'Rosado de Provenza', 4),
('wine', 'region', 'Champagne Brut', 'Champagne Brut', 5),
-- Beers
('beer', null, 'Corona Extra', 'Corona Extra', 1),
('beer', null, 'Modelo Especial', 'Modelo Especial', 2),
('beer', null, 'Pacifico', 'Pacifico', 3),
('beer', null, 'Heineken', 'Heineken', 4),
-- Mixers
('mixer', null, 'Tonic Water', 'Agua Tónica', 1),
('mixer', null, 'Club Soda', 'Soda Club', 2),
('mixer', null, 'Ginger Beer', 'Ginger Beer', 3),
('mixer', null, 'Cranberry Juice', 'Jugo de Arándano', 4);
