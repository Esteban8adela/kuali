-- Extend wizard to 5 steps (details, menu, preferences, snacks, bar)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.trips'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%wizard_step%'
  LOOP
    EXECUTE format('ALTER TABLE trips DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE trips
  ADD CONSTRAINT trips_wizard_step_check CHECK (wizard_step BETWEEN 1 AND 5);
