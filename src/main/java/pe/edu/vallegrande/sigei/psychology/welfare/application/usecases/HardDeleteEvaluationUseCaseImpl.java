package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions.EvaluationNotFoundException;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IHardDeleteEvaluationUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HardDeleteEvaluationUseCaseImpl implements IHardDeleteEvaluationUseCase {

    private final IPsychologicalEvaluationRepository repository;

    @Override
    public Mono<Void> execute(UUID id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new EvaluationNotFoundException(id.toString())))
                .flatMap(evaluation -> repository.deleteById(id))
                .doOnSuccess(v -> log.info("Evaluación eliminada físicamente: {}", id));
    }
}
