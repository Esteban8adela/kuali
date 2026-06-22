-- Bilingual dish & snack fields; beverage presentation and descriptions

ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_es TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT;

UPDATE dishes
SET
  name_en = COALESCE(name_en, name),
  name_es = COALESCE(name_es, name),
  description_en = COALESCE(description_en, description),
  description_es = COALESCE(description_es, description)
WHERE name_en IS NULL OR name_es IS NULL;

ALTER TABLE snacks
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_es TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT;

UPDATE snacks
SET
  name_en = COALESCE(name_en, name),
  name_es = COALESCE(name_es, name),
  description_en = COALESCE(description_en, ''),
  description_es = COALESCE(description_es, '')
WHERE name_en IS NULL OR name_es IS NULL;

UPDATE snacks SET category = 'general' WHERE category IS NOT NULL;

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS presentation TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT;
