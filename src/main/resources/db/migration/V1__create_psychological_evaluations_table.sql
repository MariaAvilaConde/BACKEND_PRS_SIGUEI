CREATE TABLE IF NOT EXISTS psychological_evaluations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           UUID NOT NULL,
    classroom_id         UUID NOT NULL,
    institution_id       UUID NOT NULL,
    evaluation_date      DATE NOT NULL,
    academic_year        INTEGER NOT NULL,
    evaluation_type      VARCHAR(100) NOT NULL,
    evaluation_reason    TEXT,
    emotional_development TEXT,
    social_development   TEXT,
    cognitive_development TEXT,
    motor_development    TEXT,
    observations         TEXT NOT NULL,
    recommendations      TEXT,
    requires_follow_up   BOOLEAN DEFAULT FALSE,
    follow_up_frequency  VARCHAR(50),
    evaluated_by         UUID,
    evaluator_name       VARCHAR(255),
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    evaluated_at         TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psych_eval_student_id ON psychological_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_psych_eval_classroom_id ON psychological_evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_psych_eval_institution_id ON psychological_evaluations(institution_id);
CREATE INDEX IF NOT EXISTS idx_psych_eval_status ON psychological_evaluations(status);
