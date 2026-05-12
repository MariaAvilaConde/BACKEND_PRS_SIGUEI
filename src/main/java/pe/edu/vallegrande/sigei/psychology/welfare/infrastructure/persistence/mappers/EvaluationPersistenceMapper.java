package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.mappers;

import org.springframework.stereotype.Component;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.entities.PsychologicalEvaluationEntity;

@Component
public class EvaluationPersistenceMapper {

    public PsychologicalEvaluationEntity toEntity(PsychologicalEvaluation domain) {
        PsychologicalEvaluationEntity.PsychologicalEvaluationEntityBuilder builder = PsychologicalEvaluationEntity.builder()
                .studentId(domain.getStudentId())
                .classroomId(domain.getClassroomId())
                .institutionId(domain.getInstitutionId())
                .evaluationDate(domain.getEvaluationDate())
                .academicYear(domain.getAcademicYear())
                .evaluationType(domain.getEvaluationType())
                .evaluationReason(domain.getEvaluationReason())
                .emotionalDevelopment(domain.getEmotionalDevelopment())
                .socialDevelopment(domain.getSocialDevelopment())
                .cognitiveDevelopment(domain.getCognitiveDevelopment())
                .motorDevelopment(domain.getMotorDevelopment())
                .observations(domain.getObservations())
                .recommendations(domain.getRecommendations())
                .requiresFollowUp(domain.getRequiresFollowUp())
                .followUpFrequency(domain.getFollowUpFrequency())
                .evaluatedBy(domain.getEvaluatedBy())
                .evaluatorName(domain.getEvaluatorName())
                .updatedBy(domain.getUpdatedBy())
                .status(domain.getStatus())
                .evaluatedAt(domain.getEvaluatedAt())
                .updatedAt(domain.getUpdatedAt());
        
        // Solo establecer el ID si no es null (para updates)
        if (domain.getId() != null) {
            builder.id(domain.getId());
        }
        
        return builder.build();
    }

    public PsychologicalEvaluation toDomain(PsychologicalEvaluationEntity entity) {
        return PsychologicalEvaluation.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .classroomId(entity.getClassroomId())
                .institutionId(entity.getInstitutionId())
                .evaluationDate(entity.getEvaluationDate())
                .academicYear(entity.getAcademicYear())
                .evaluationType(entity.getEvaluationType())
                .evaluationReason(entity.getEvaluationReason())
                .emotionalDevelopment(entity.getEmotionalDevelopment())
                .socialDevelopment(entity.getSocialDevelopment())
                .cognitiveDevelopment(entity.getCognitiveDevelopment())
                .motorDevelopment(entity.getMotorDevelopment())
                .observations(entity.getObservations())
                .recommendations(entity.getRecommendations())
                .requiresFollowUp(entity.getRequiresFollowUp())
                .followUpFrequency(entity.getFollowUpFrequency())
                .evaluatedBy(entity.getEvaluatedBy())
                .evaluatorName(entity.getEvaluatorName())
                .updatedBy(entity.getUpdatedBy())
                .status(entity.getStatus())
                .evaluatedAt(entity.getEvaluatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
