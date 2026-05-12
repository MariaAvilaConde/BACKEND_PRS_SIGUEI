ALTER TABLE psychological_evaluations
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
