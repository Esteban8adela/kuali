-- Soft-cancel trips without hard delete
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'cancelled';
