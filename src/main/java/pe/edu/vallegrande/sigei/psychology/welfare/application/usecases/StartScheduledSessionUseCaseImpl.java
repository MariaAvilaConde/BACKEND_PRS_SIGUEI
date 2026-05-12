package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions.EvaluationNotFoundException;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IStartScheduledSessionUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StartScheduledSessionUseCaseImpl implements IStartScheduledSessionUseCase {

    private final IPsychologicalEvaluationRepository repository;

    @Override
    public Mono<PsychologicalEvaluation> execute(UUID id, PsychologicalEvaluation updates) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new EvaluationNotFoundException(id.toString())))
                .flatMap(existing -> {
                    if (!"SCHEDULED".equals(existing.getStatus())) {
                        return Mono.error(new IllegalStateException(
                                "Solo se pueden iniciar sesiones con estado SCHEDULED. Estado actual: " + existing.getStatus()));
                    }
                    // Actualizar campos clínicos y cambiar a ACTIVE
                    if (updates.getObservations() != null)        existing.setObservations(updates.getObservations());
                    if (updates.getRecommendations() != null)     existing.setRecommendations(updates.getRecommendations());
                    if (updates.getEmotionalDevelopment() != null) existing.setEmotionalDevelopment(updates.getEmotionalDevelopment());
                    if (updates.getSocialDevelopment() != null)   existing.setSocialDevelopment(updates.getSocialDevelopment());
                    if (updates.getCognitiveDevelopment() != null) existing.setCognitiveDevelopment(updates.getCognitiveDevelopment());
                    if (updates.getMotorDevelopment() != null)    existing.setMotorDevelopment(updates.getMotorDevelopment());
                    if (updates.getEvaluationReason() != null)    existing.setEvaluationReason(updates.getEvaluationReason());
                    if (updates.getRequiresFollowUp() != null)    existing.setRequiresFollowUp(updates.getRequiresFollowUp());
                    if (updates.getFollowUpFrequency() != null)   existing.setFollowUpFrequency(updates.getFollowUpFrequency());
                    if (updates.getUpdatedBy() != null)           existing.setUpdatedBy(updates.getUpdatedBy());

                    existing.setStatus("ACTIVE");
                    existing.setUpdatedAt(LocalDateTime.now());
                    
                    log.info("Iniciando sesión programada {} → ACTIVE. Actualizado por: {}", id, updates.getUpdatedBy());
                    return repository.save(existing);
                })
                .doOnSuccess(ev -> log.info("Sesión programada iniciada: {}", id));
    }
}
