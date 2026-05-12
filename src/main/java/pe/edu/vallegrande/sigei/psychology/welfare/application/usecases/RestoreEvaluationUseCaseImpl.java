package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions.EvaluationNotFoundException;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IRestoreEvaluationUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestoreEvaluationUseCaseImpl implements IRestoreEvaluationUseCase {

    private final IPsychologicalEvaluationRepository repository;

    @Override
    public Mono<PsychologicalEvaluation> execute(UUID id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new EvaluationNotFoundException(id.toString())))
                .flatMap(evaluation -> {
                    evaluation.setStatus("ACTIVE");
                    evaluation.setUpdatedAt(LocalDateTime.now());
                    return repository.save(evaluation);
                })
                .doOnSuccess(restored -> log.info("Evaluación restaurada: {}", id));
    }
}
