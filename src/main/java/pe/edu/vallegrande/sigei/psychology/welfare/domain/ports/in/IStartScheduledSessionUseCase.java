package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface IStartScheduledSessionUseCase {
    Mono<PsychologicalEvaluation> execute(UUID id, PsychologicalEvaluation updates);
}
