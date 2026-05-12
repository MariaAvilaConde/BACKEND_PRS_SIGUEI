package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions.EvaluationNotFoundException;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IUpdateEvaluationUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UpdateEvaluationUseCaseImpl implements IUpdateEvaluationUseCase {

    private final IPsychologicalEvaluationRepository repository;

    @Override
    public Mono<PsychologicalEvaluation> execute(UUID id, PsychologicalEvaluation updates) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new EvaluationNotFoundException(id.toString())))
                .flatMap(existing -> {
                    if (updates.getStudentId() != null) existing.setStudentId(updates.getStudentId());
                    if (updates.getClassroomId() != null) existing.setClassroomId(updates.getClassroomId());
                    if (updates.getInstitutionId() != null) existing.setInstitutionId(updates.getInstitutionId());
                    if (updates.getEvaluationDate() != null) existing.setEvaluationDate(updates.getEvaluationDate());
                    if (updates.getAcademicYear() != null) existing.setAcademicYear(updates.getAcademicYear());
                    if (updates.getEvaluationType() != null) existing.setEvaluationType(updates.getEvaluationType());
                    if (updates.getEvaluationReason() != null) existing.setEvaluationReason(updates.getEvaluationReason());
                    if (updates.getEmotionalDevelopment() != null) existing.setEmotionalDevelopment(updates.getEmotionalDevelopment());
                    if (updates.getSocialDevelopment() != null) existing.setSocialDevelopment(updates.getSocialDevelopment());
                    if (updates.getCognitiveDevelopment() != null) existing.setCognitiveDevelopment(updates.getCognitiveDevelopment());
                    if (updates.getMotorDevelopment() != null) existing.setMotorDevelopment(updates.getMotorDevelopment());
                    if (updates.getObservations() != null) existing.setObservations(updates.getObservations());
                    if (updates.getRecommendations() != null) existing.setRecommendations(updates.getRecommendations());
                    if (updates.getRequiresFollowUp() != null) existing.setRequiresFollowUp(updates.getRequiresFollowUp());
                    if (updates.getFollowUpFrequency() != null) existing.setFollowUpFrequency(updates.getFollowUpFrequency());
                    if (updates.getEvaluatorName() != null) existing.setEvaluatorName(updates.getEvaluatorName());
                    if (updates.getUpdatedBy() != null) existing.setUpdatedBy(updates.getUpdatedBy());
                    // si el status quedó null en BD por bug anterior, lo restauramos
                    if (existing.getStatus() == null) existing.setStatus("ACTIVE");
                    existing.setUpdatedAt(updates.getUpdatedAt());
                    return repository.save(existing);
                })
                .doOnSuccess(updated -> log.info("Evaluación actualizada: {}", id));
    }
}
