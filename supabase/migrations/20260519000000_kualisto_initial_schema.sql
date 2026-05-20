-- Kualisto initial schema
-- Luxury catamaran culinary & inventory management

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('renta', 'socio', 'admin', 'chef');
CREATE TYPE trip_status AS ENUM ('draft', 'submitted', 'active', 'completed', 'settled');
CREATE TYPE payment_model AS ENUM ('prepaid', 'postpaid');
CREATE TYPE price_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');
CREATE TYPE menu_selection_type AS ENUM ('predefined', 'surprise', 'custom');
CREATE TYPE participant_type AS ENUM ('adult', 'child');
CREATE TYPE portion_override AS ENUM ('default', 'adult_on_child', 'child_on_adult');
CREATE TYPE stock_category AS ENUM ('soda', 'water', 'beer', 'wine', 'spirit', 'mixer', 'other');

-- Profiles (Perfiles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'renta',
  full_name TEXT,
  phone TEXT,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'es')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trips (Viajes)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status trip_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  adult_count INTEGER NOT NULL DEFAULT 2 CHECK (adult_count >= 0),
  child_count INTEGER NOT NULL DEFAULT 0 CHECK (child_count >= 0),
  crew_count INTEGER GENERATED ALWAYS AS (
    CASE WHEN adult_count + child_count > 8 THEN 4 ELSE 3 END
  ) STORED,
  payment_model payment_model NOT NULL DEFAULT 'prepaid',
  prepaid_amount_cents INTEGER NOT NULL DEFAULT 0,
  estimated_total_cents INTEGER NOT NULL DEFAULT 0,
  final_total_cents INTEGER,
  balance_cents INTEGER,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'es')),
  notes TEXT,
  wizard_step INTEGER NOT NULL DEFAULT 1 CHECK (wizard_step BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trips_at_least_one_guest CHECK (adult_count + child_count >= 1),
  CONSTRAINT trips_dates_valid CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_created_by ON trips(created_by);

-- Trip participants
CREATE TABLE trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  participant_type participant_type NOT NULL DEFAULT 'adult',
  sort_order INTEGER NOT NULL DEFAULT 0,
  portion_override portion_override NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_participants_trip ON trip_participants(trip_id);

-- Guest preferences (Huéspedes_Preferencias)
CREATE TABLE guest_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL UNIQUE REFERENCES trip_participants(id) ON DELETE CASCADE,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  protein_preferences TEXT[] NOT NULL DEFAULT '{}',
  dairy_preferences TEXT[] NOT NULL DEFAULT '{}',
  general_food_notes TEXT[] NOT NULL DEFAULT '{}',
  meal_schedule JSONB NOT NULL DEFAULT '{}',
  bar_preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_preferences_allergies ON guest_preferences USING GIN (allergies);

-- Menus (Menús)
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  price_tier price_tier NOT NULL,
  price_adult_cents INTEGER NOT NULL CHECK (price_adult_cents >= 0),
  price_child_cents INTEGER NOT NULL CHECK (price_child_cents >= 0),
  season TEXT,
  is_seasonal BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menus_active ON menus(is_active) WHERE is_active = true;
CREATE INDEX idx_menus_tier ON menus(price_tier);

-- Trip menu selections
CREATE TABLE trip_menu_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES trip_participants(id) ON DELETE SET NULL,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  selection_type menu_selection_type NOT NULL DEFAULT 'predefined',
  custom_notes TEXT,
  quantity_adult INTEGER NOT NULL DEFAULT 0,
  quantity_child INTEGER NOT NULL DEFAULT 0,
  unit_price_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_menu_selections_trip ON trip_menu_selections(trip_id);

-- Stock items (Items_Stock)
CREATE TABLE stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  category stock_category NOT NULL DEFAULT 'other',
  unit_label TEXT NOT NULL DEFAULT 'unit',
  default_base_qty INTEGER NOT NULL DEFAULT 0 CHECK (default_base_qty >= 0),
  unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip stock lines (Consumo_Viaje)
CREATE TABLE trip_stock_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  initial_qty INTEGER NOT NULL DEFAULT 0 CHECK (initial_qty >= 0),
  consumed_qty INTEGER CHECK (consumed_qty IS NULL OR consumed_qty >= 0),
  unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  chargeable_qty INTEGER GENERATED ALWAYS AS (COALESCE(consumed_qty, 0)) STORED,
  line_total_cents INTEGER GENERATED ALWAYS AS (COALESCE(consumed_qty, 0) * unit_price_cents) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, stock_item_id)
);

CREATE INDEX idx_trip_stock_lines_trip ON trip_stock_lines(trip_id);

-- Trip settlements
CREATE TABLE trip_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  prepaid_cents INTEGER NOT NULL DEFAULT 0,
  actual_cents INTEGER NOT NULL DEFAULT 0,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  settled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chef daily costs
CREATE TABLE chef_daily_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  notes TEXT,
  ingredient_cost_estimates JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (Chef <-> guest)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_trip ON messages(trip_id);

-- Helper: current user role from JWT app_metadata or profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    (auth.jwt() -> 'app_metadata' ->> 'role')::user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_chef()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_user_role() IN ('admin', 'chef');
$$;

CREATE OR REPLACE FUNCTION public.owns_trip(trip_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_uuid AND t.created_by = auth.uid()
  );
$$;

-- Crew count function
CREATE OR REPLACE FUNCTION fn_trip_crew_count(p_adults INTEGER, p_children INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_adults + p_children > 8 THEN 4 ELSE 3 END;
$$;

-- Seed trip stock when trip becomes active
CREATE OR REPLACE FUNCTION fn_seed_trip_stock(p_trip_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO trip_stock_lines (trip_id, stock_item_id, initial_qty, unit_price_cents)
  SELECT p_trip_id, si.id, si.default_base_qty, si.unit_price_cents
  FROM stock_items si
  WHERE si.is_active = true
  ON CONFLICT (trip_id, stock_item_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION fn_on_trip_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    PERFORM fn_seed_trip_stock(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trip_status_seed_stock
  AFTER UPDATE OF status ON trips
  FOR EACH ROW
  EXECUTE FUNCTION fn_on_trip_status_change();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  v_role := COALESCE(
    (NEW.raw_app_meta_data ->> 'role')::user_role,
    'renta'
  );
  INSERT INTO profiles (id, role, full_name, locale)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_handle_new_user();

-- Set payment_model from creator role on insert
CREATE OR REPLACE FUNCTION fn_set_trip_payment_model()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_role user_role;
BEGIN
  SELECT role INTO creator_role FROM profiles WHERE id = NEW.created_by;
  IF creator_role = 'socio' THEN
    NEW.payment_model := 'postpaid';
  ELSIF creator_role = 'renta' THEN
    NEW.payment_model := 'prepaid';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trip_payment_model
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_trip_payment_model();

-- updated_at trigger
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_trip_participants_updated_at BEFORE UPDATE ON trip_participants FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_guest_preferences_updated_at BEFORE UPDATE ON guest_preferences FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_trip_menu_selections_updated_at BEFORE UPDATE ON trip_menu_selections FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_trip_stock_lines_updated_at BEFORE UPDATE ON trip_stock_lines FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_chef_daily_costs_updated_at BEFORE UPDATE ON chef_daily_costs FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_menu_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stock_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin_or_chef());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- Trips policies
CREATE POLICY trips_guest_select ON trips FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_admin_or_chef());
CREATE POLICY trips_guest_insert ON trips FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND current_user_role() IN ('renta', 'socio'));
CREATE POLICY trips_guest_update ON trips FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY trips_guest_delete ON trips FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND status = 'draft');
CREATE POLICY trips_chef_update ON trips FOR UPDATE TO authenticated
  USING (is_admin_or_chef()) WITH CHECK (is_admin_or_chef());
CREATE POLICY trips_admin_all ON trips FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- Trip participants
CREATE POLICY trip_participants_select ON trip_participants FOR SELECT TO authenticated
  USING (owns_trip(trip_id) OR is_admin_or_chef());
CREATE POLICY trip_participants_insert ON trip_participants FOR INSERT TO authenticated
  WITH CHECK (owns_trip(trip_id) OR current_user_role() = 'admin');
CREATE POLICY trip_participants_update ON trip_participants FOR UPDATE TO authenticated
  USING (owns_trip(trip_id) OR is_admin_or_chef());
CREATE POLICY trip_participants_delete ON trip_participants FOR DELETE TO authenticated
  USING (owns_trip(trip_id) OR current_user_role() = 'admin');

-- Guest preferences
CREATE POLICY guest_preferences_select ON guest_preferences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants tp
      JOIN trips t ON t.id = tp.trip_id
      WHERE tp.id = guest_preferences.participant_id
        AND (t.created_by = auth.uid() OR is_admin_or_chef())
    )
  );
CREATE POLICY guest_preferences_insert ON guest_preferences FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_participants tp
      JOIN trips t ON t.id = tp.trip_id
      WHERE tp.id = guest_preferences.participant_id AND t.created_by = auth.uid()
    ) OR is_admin_or_chef()
  );
CREATE POLICY guest_preferences_update ON guest_preferences FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants tp
      JOIN trips t ON t.id = tp.trip_id
      WHERE tp.id = guest_preferences.participant_id
        AND (t.created_by = auth.uid() OR is_admin_or_chef())
    )
  );

-- Menus
CREATE POLICY menus_select_active ON menus FOR SELECT TO authenticated
  USING (is_active = true OR is_admin_or_chef());
CREATE POLICY menus_chef_update ON menus FOR UPDATE TO authenticated
  USING (current_user_role() IN ('chef', 'admin'));
CREATE POLICY menus_admin_all ON menus FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- Trip menu selections
CREATE POLICY trip_menu_selections_select ON trip_menu_selections FOR SELECT TO authenticated
  USING (owns_trip(trip_id) OR is_admin_or_chef());
CREATE POLICY trip_menu_selections_mutate ON trip_menu_selections FOR ALL TO authenticated
  USING (owns_trip(trip_id) OR is_admin_or_chef())
  WITH CHECK (owns_trip(trip_id) OR is_admin_or_chef());

-- Stock items
CREATE POLICY stock_items_select ON stock_items FOR SELECT TO authenticated
  USING (is_active = true OR is_admin_or_chef());
CREATE POLICY stock_items_admin ON stock_items FOR ALL TO authenticated
  USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- Trip stock lines
CREATE POLICY trip_stock_lines_select ON trip_stock_lines FOR SELECT TO authenticated
  USING (owns_trip(trip_id) OR is_admin_or_chef());
CREATE POLICY trip_stock_lines_update ON trip_stock_lines FOR UPDATE TO authenticated
  USING (is_admin_or_chef()) WITH CHECK (is_admin_or_chef());
CREATE POLICY trip_stock_lines_insert ON trip_stock_lines FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_chef() OR owns_trip(trip_id));

-- Settlements, costs, messages
CREATE POLICY trip_settlements_admin ON trip_settlements FOR ALL TO authenticated
  USING (is_admin_or_chef()) WITH CHECK (is_admin_or_chef());

CREATE POLICY chef_daily_costs_select ON chef_daily_costs FOR SELECT TO authenticated
  USING (is_admin_or_chef() OR owns_trip(trip_id));
CREATE POLICY chef_daily_costs_mutate ON chef_daily_costs FOR ALL TO authenticated
  USING (current_user_role() IN ('chef', 'admin'))
  WITH CHECK (current_user_role() IN ('chef', 'admin'));

CREATE POLICY messages_select ON messages FOR SELECT TO authenticated
  USING (owns_trip(trip_id) OR is_admin_or_chef());
CREATE POLICY messages_insert ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (owns_trip(trip_id) OR is_admin_or_chef())
  );

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_menu_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_stock_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_participants;

-- Seed: Menus
INSERT INTO menus (slug, name_en, name_es, description_en, description_es, price_tier, price_adult_cents, price_child_cents, season, is_seasonal, sort_order) VALUES
('coastal-brunch', 'Coastal Brunch', 'Brunch Costero', 'Fresh local fruits, ceviche, and artisan pastries.', 'Frutas locales, ceviche y repostería artesanal.', 'tier_1', 8500, 4500, 'summer_2026', true, 1),
('casual-grill', 'Casual Grill Night', 'Noche Parrillera Casual', 'Grilled catch of the day with tropical sides.', 'Pesca del día a la parrilla con guarniciones tropicales.', 'tier_1', 9500, 5000, NULL, false, 2),
('mediterranean-feast', 'Mediterranean Feast', 'Festín Mediterráneo', 'Olive oil, seafood paella, and fine cheeses.', 'Aceite de oliva, paella de mariscos y quesos finos.', 'tier_2', 14500, 7500, 'summer_2026', true, 3),
('bistro-sunset', 'Bistro Sunset', 'Bistro al Atardecer', 'Premium bistro classics with wine pairings.', 'Clásicos bistro premium con maridaje.', 'tier_2', 16500, 8500, NULL, false, 4),
('omakase-sea', 'Omakase at Sea', 'Omakase en el Mar', 'Chef-curated tasting menu with premium seafood.', 'Menú degustación del chef con mariscos premium.', 'tier_3', 28500, 14000, 'summer_2026', true, 5),
('ultra-luxury-gala', 'Ultra Luxury Gala', 'Gala Ultra Lujo', 'Multi-course gala with champagne service.', 'Cena de gala multicourse con servicio de champagne.', 'tier_3', 35000, 17500, NULL, false, 6),
('kids-ocean-fun', 'Kids Ocean Fun', 'Diversión Oceánica Kids', 'Kid-friendly favorites with healthy options.', 'Favoritos infantiles con opciones saludables.', 'tier_1', 5500, 5500, NULL, false, 7),
('chef-tasting', 'Chef Tasting Journey', 'Viaje de Degustación', 'Exclusive chef selection — price on consultation.', 'Selección exclusiva del chef.', 'tier_3', 32000, 16000, NULL, false, 8);

-- Seed: Stock items
INSERT INTO stock_items (sku, name_en, name_es, category, unit_label, default_base_qty, unit_price_cents) VALUES
('COCA-REG', 'Coca-Cola Regular', 'Coca-Cola Regular', 'soda', 'can', 24, 35),
('COCA-ZERO', 'Coca-Cola Zero', 'Coca-Cola Zero', 'soda', 'can', 40, 35),
('SPRITE', 'Sprite', 'Sprite', 'soda', 'can', 12, 35),
('WATER-NAT', 'Natural Water', 'Agua Natural', 'water', 'bottle', 48, 25),
('WATER-MIN', 'Mineral Water', 'Agua Mineral', 'water', 'bottle', 36, 45),
('BEER-DOM', 'Domestic Beer', 'Cerveza Nacional', 'beer', 'bottle', 24, 55),
('BEER-IMP', 'Imported Beer', 'Cerveza Importada', 'beer', 'bottle', 18, 85),
('WINE-RED', 'House Red Wine', 'Vino Tinto de la Casa', 'wine', 'bottle', 12, 450),
('WINE-WHT', 'House White Wine', 'Vino Blanco de la Casa', 'wine', 'bottle', 12, 450),
('WINE-ROSE', 'House Rosé', 'Rosado de la Casa', 'wine', 'bottle', 8, 480),
('CHAMP', 'Champagne', 'Champagne', 'wine', 'bottle', 6, 1200),
('VODKA', 'Premium Vodka', 'Vodka Premium', 'spirit', 'bottle', 4, 950),
('TEQUILA', 'Premium Tequila', 'Tequila Premium', 'spirit', 'bottle', 4, 1100),
('TONIC', 'Tonic Water', 'Agua Tónica', 'mixer', 'bottle', 12, 40),
('SODA-MIX', 'Club Soda', 'Soda Club', 'mixer', 'bottle', 12, 35);
