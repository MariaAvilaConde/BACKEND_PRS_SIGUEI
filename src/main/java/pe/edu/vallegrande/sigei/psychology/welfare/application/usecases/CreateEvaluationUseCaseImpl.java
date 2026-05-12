package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.ICreateEvaluationUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IUserServiceClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreateEvaluationUseCaseImpl implements ICreateEvaluationUseCase {

    private final IPsychologicalEvaluationRepository repository;
    private final IUserServiceClient userServiceClient;

    @Override
    public Mono<PsychologicalEvaluation> execute(PsychologicalEvaluation evaluation) {
        // Respetar SCHEDULED si viene del request; si no, forzar ACTIVE
        if (!"SCHEDULED".equals(evaluation.getStatus())) {
            evaluation.setStatus("ACTIVE");
        }

        if (evaluation.getEvaluatedBy() == null) {
            return repository.save(evaluation)
                    .doOnSuccess(saved -> log.info("Evaluación creada con status {}: {}", saved.getStatus(), saved.getId()));
        }

        return userServiceClient.getUserById(evaluation.getEvaluatedBy().toString())
                .doOnNext(user -> {
                    String fullName = user.getFirstName() + " " + user.getLastName();
                    evaluation.setEvaluatorName(fullName);
                    log.info("Evaluador encontrado: {}", fullName);
                })
                .onErrorResume(e -> {
                    log.warn("No se pudo obtener el usuario {}: {}", evaluation.getEvaluatedBy(), e.getMessage());
                    return Mono.empty();
                })
                .then(repository.save(evaluation))
                .doOnSuccess(saved -> log.info("Evaluación creada con status {}: {}", saved.getStatus(), saved.getId()));
    }
}
