package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.adapters.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.mappers.EvaluationPersistenceMapper;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.repositories.EvaluationR2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PsychologicalEvaluationRepositoryImpl implements IPsychologicalEvaluationRepository {

    private final EvaluationR2dbcRepository r2dbcRepository;
    private final EvaluationPersistenceMapper mapper;

    @Override
    public Mono<PsychologicalEvaluation> save(PsychologicalEvaluation evaluation) {
        return r2dbcRepository.save(mapper.toEntity(evaluation))
                .map(mapper::toDomain);
    }

    @Override
    public Mono<PsychologicalEvaluation> findById(UUID id) {
        return r2dbcRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<PsychologicalEvaluation> findAll() {
        return r2dbcRepository.findAllIncludingInactive()
                .map(mapper::toDomain);
    }

    @Override
    public Flux<PsychologicalEvaluation> findByStudentId(UUID studentId) {
        return r2dbcRepository.findByStudentId(studentId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<PsychologicalEvaluation> findByInstitutionId(UUID institutionId) {
        return r2dbcRepository.findByInstitutionId(institutionId)
                .map(mapper::toDomain);
    }

    @Override
    public Flux<PsychologicalEvaluation> findByClassroomId(UUID classroomId) {
        return r2dbcRepository.findByClassroomId(classroomId)
                .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbcRepository.deleteById(id);
    }
}
