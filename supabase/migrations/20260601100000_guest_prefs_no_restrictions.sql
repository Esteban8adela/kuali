ALTER TABLE guest_preferences
  ADD COLUMN IF NOT EXISTS no_dietary_restrictions BOOLEAN NOT NULL DEFAULT false;
