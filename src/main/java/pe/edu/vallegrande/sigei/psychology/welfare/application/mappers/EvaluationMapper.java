package pe.edu.vallegrande.sigei.psychology.welfare.application.mappers;

import org.springframework.stereotype.Component;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request.CreateEvaluationRequest;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request.UpdateEvaluationRequest;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.EvaluationResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;

import java.time.LocalDateTime;

@Component
public class EvaluationMapper {

    public PsychologicalEvaluation toDomain(CreateEvaluationRequest request) {
        boolean isScheduled = Boolean.TRUE.equals(request.getScheduled());
        return PsychologicalEvaluation.builder()
                .studentId(request.getStudentId())
                .classroomId(request.getClassroomId())
                .institutionId(request.getInstitutionId())
                .evaluationDate(request.getEvaluationDate())
                .academicYear(request.getAcademicYear())
                .evaluationType(request.getEvaluationType())
                .evaluationReason(request.getEvaluationReason())
                .emotionalDevelopment(request.getEmotionalDevelopment())
                .socialDevelopment(request.getSocialDevelopment())
                .cognitiveDevelopment(request.getCognitiveDevelopment())
                .motorDevelopment(request.getMotorDevelopment())
                .observations(request.getObservations())
                .recommendations(request.getRecommendations())
                .requiresFollowUp(request.getRequiresFollowUp())
                .followUpFrequency(request.getFollowUpFrequency())
                .evaluatedBy(request.getEvaluatedBy())
                .evaluatorName(request.getEvaluatorName())
                .status(isScheduled ? "SCHEDULED" : "ACTIVE")
                .evaluatedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public PsychologicalEvaluation mapUpdateToDomain(UpdateEvaluationRequest request) {
        return PsychologicalEvaluation.builder()
                .studentId(request.getStudentId())
                .classroomId(request.getClassroomId())
                .institutionId(request.getInstitutionId())
                .evaluationDate(request.getEvaluationDate())
                .academicYear(request.getAcademicYear())
                .evaluationType(request.getEvaluationType())
                .evaluationReason(request.getEvaluationReason())
                .emotionalDevelopment(request.getEmotionalDevelopment())
                .socialDevelopment(request.getSocialDevelopment())
                .cognitiveDevelopment(request.getCognitiveDevelopment())
                .motorDevelopment(request.getMotorDevelopment())
                .observations(request.getObservations())
                .recommendations(request.getRecommendations())
                .requiresFollowUp(request.getRequiresFollowUp())
                .followUpFrequency(request.getFollowUpFrequency())
                .evaluatorName(request.getEvaluatorName())
                .updatedBy(request.getUpdatedBy())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public EvaluationResponse toResponse(PsychologicalEvaluation evaluation) {
        return EvaluationResponse.builder()
                .id(evaluation.getId())
                .studentId(evaluation.getStudentId())
                .classroomId(evaluation.getClassroomId())
                .institutionId(evaluation.getInstitutionId())
                .evaluationDate(evaluation.getEvaluationDate())
                .academicYear(evaluation.getAcademicYear())
                .evaluationType(evaluation.getEvaluationType())
                .evaluationReason(evaluation.getEvaluationReason())
                .emotionalDevelopment(evaluation.getEmotionalDevelopment())
                .socialDevelopment(evaluation.getSocialDevelopment())
                .cognitiveDevelopment(evaluation.getCognitiveDevelopment())
                .motorDevelopment(evaluation.getMotorDevelopment())
                .observations(evaluation.getObservations())
                .recommendations(evaluation.getRecommendations())
                .requiresFollowUp(evaluation.getRequiresFollowUp())
                .followUpFrequency(evaluation.getFollowUpFrequency())
                .evaluatedBy(evaluation.getEvaluatedBy())
                .evaluatorName(evaluation.getEvaluatorName())
                .updatedBy(evaluation.getUpdatedBy())
                .status(evaluation.getStatus())
                .evaluatedAt(evaluation.getEvaluatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }
}
