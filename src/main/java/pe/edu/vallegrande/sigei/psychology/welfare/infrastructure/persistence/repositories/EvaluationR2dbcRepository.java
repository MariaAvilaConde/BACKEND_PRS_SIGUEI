package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.repositories;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.entities.PsychologicalEvaluationEntity;
import reactor.core.publisher.Flux;

import java.util.UUID;

@Repository
public interface EvaluationR2dbcRepository extends R2dbcRepository<PsychologicalEvaluationEntity, UUID> {
    Flux<PsychologicalEvaluationEntity> findByStudentId(UUID studentId);
    Flux<PsychologicalEvaluationEntity> findByInstitutionId(UUID institutionId);
    Flux<PsychologicalEvaluationEntity> findByClassroomId(UUID classroomId);
    Flux<PsychologicalEvaluationEntity> findByStatus(String status);

    @Query("SELECT * FROM psychological_evaluations WHERE status = 'ACTIVE' OR status IS NULL")
    Flux<PsychologicalEvaluationEntity> findAllActive();

    @Query("SELECT * FROM psychological_evaluations")
    Flux<PsychologicalEvaluationEntity> findAllIncludingInactive();
}
