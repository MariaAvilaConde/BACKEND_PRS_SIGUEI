-- Ampliar el CHECK constraint de status para incluir SCHEDULED
-- Primero eliminamos el constraint existente (nombre puede variar según Neon/PostgreSQL)
DO $$
BEGIN
    -- Eliminar constraint si existe con nombre estándar
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'psychological_evaluations'::regclass
        AND contype = 'c'
        AND conname LIKE '%status%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE psychological_evaluations DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'psychological_evaluations'::regclass
            AND contype = 'c'
            AND conname LIKE '%status%'
            LIMIT 1
        );
    END IF;
END $$;

-- Recrear con SCHEDULED incluido
ALTER TABLE psychological_evaluations
    ADD CONSTRAINT psychological_evaluations_status_check
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SCHEDULED', 'A', 'I'));
