-- Hacer que los campos clínicos sean opcionales para sesiones programadas
ALTER TABLE psychological_evaluations 
    ALTER COLUMN observations DROP NOT NULL,
    ALTER COLUMN recommendations DROP NOT NULL,
    ALTER COLUMN emotional_development DROP NOT NULL,
    ALTER COLUMN social_development DROP NOT NULL,
    ALTER COLUMN cognitive_development DROP NOT NULL,
    ALTER COLUMN motor_development DROP NOT NULL;
