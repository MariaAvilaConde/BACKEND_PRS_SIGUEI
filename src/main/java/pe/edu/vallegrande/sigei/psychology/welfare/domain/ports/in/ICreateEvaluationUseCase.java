package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import reactor.core.publisher.Mono;

public interface ICreateEvaluationUseCase {
    Mono<PsychologicalEvaluation> execute(PsychologicalEvaluation evaluation);
}
