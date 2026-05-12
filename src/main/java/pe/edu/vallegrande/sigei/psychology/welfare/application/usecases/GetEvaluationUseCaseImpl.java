package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions.EvaluationNotFoundException;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IGetEvaluationUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetEvaluationUseCaseImpl implements IGetEvaluationUseCase {

    private final IPsychologicalEvaluationRepository repository;

    @Override
    public Mono<PsychologicalEvaluation> findById(UUID id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new EvaluationNotFoundException(id.toString())));
    }

    @Override
    public Flux<PsychologicalEvaluation> findAll() {
        return repository.findAll();
    }

    @Override
    public Flux<PsychologicalEvaluation> findByStudentId(UUID studentId) {
        return repository.findByStudentId(studentId);
    }

    @Override
    public Flux<PsychologicalEvaluation> findByInstitutionId(UUID institutionId) {
        return repository.findByInstitutionId(institutionId);
    }

    @Override
    public Flux<PsychologicalEvaluation> findByClassroomId(UUID classroomId) {
        return repository.findByClassroomId(classroomId);
    }
}
