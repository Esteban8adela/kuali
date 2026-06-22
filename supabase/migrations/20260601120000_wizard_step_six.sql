ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_wizard_step_check;

ALTER TABLE trips
  ADD CONSTRAINT trips_wizard_step_check CHECK (wizard_step BETWEEN 1 AND 6);
