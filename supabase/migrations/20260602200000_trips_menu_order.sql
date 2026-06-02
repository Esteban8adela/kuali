-- Guest wizard step 2: structured menu selections linked to dishes catalog
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS menu_order JSONB NOT NULL DEFAULT '{}';
