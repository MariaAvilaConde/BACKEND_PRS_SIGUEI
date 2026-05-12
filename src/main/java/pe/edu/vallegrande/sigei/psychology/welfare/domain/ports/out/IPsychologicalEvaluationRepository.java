package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface IPsychologicalEvaluationRepository {
    Mono<PsychologicalEvaluation> save(PsychologicalEvaluation evaluation);
    Mono<PsychologicalEvaluation> findById(UUID id);
    Flux<PsychologicalEvaluation> findAll();
    Flux<PsychologicalEvaluation> findByStudentId(UUID studentId);
    Flux<PsychologicalEvaluation> findByInstitutionId(UUID institutionId);
    Flux<PsychologicalEvaluation> findByClassroomId(UUID classroomId);
    Mono<Void> deleteById(UUID id);
}
