-- Bilingual names for always onboard and charcuterie pantry items

ALTER TABLE always_onboard_items
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_es TEXT;

ALTER TABLE charcuterie_items
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_es TEXT;

UPDATE always_onboard_items
SET
  name_en = COALESCE(name_en, name),
  name_es = COALESCE(name_es, name)
WHERE name_en IS NULL OR name_es IS NULL;

UPDATE charcuterie_items
SET
  name_en = COALESCE(name_en, name),
  name_es = COALESCE(name_es, name)
WHERE name_en IS NULL OR name_es IS NULL;
