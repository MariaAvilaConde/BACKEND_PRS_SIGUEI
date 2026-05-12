package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.mappers;

import org.springframework.stereotype.Component;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.EvaluationStatus;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.SupportType;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.entities.SpecialNeedsSupportEntity;

@Component
public class SpecialNeedsSupportPersistenceMapper {

    public SpecialNeedsSupportEntity toEntity(SpecialNeedsSupport domain) {
        return SpecialNeedsSupportEntity.builder()
                .id(domain.getId())
                .studentId(domain.getStudentId())
                .classroomId(domain.getClassroomId())
                .institutionId(domain.getInstitutionId())
                .academicYear(domain.getAcademicYear())
                .diagnosis(domain.getDiagnosis())
                .diagnosisDate(domain.getDiagnosisDate())
                .diagnosedBy(domain.getDiagnosedBy())
                .supportType(domain.getSupportType() != null ? domain.getSupportType().name() : null)
                .description(domain.getDescription())
                .adaptationsRequired(domain.getAdaptationsRequired())
                .supportMaterials(domain.getSupportMaterials())
                .specialistInvolved(domain.getSpecialistInvolved())
                .progressNotes(domain.getProgressNotes())
                .lastReviewDate(domain.getLastReviewDate())
                .nextReviewDate(domain.getNextReviewDate())
                .status(domain.getStatus() != null ? domain.getStatus().name() : null)
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }

    public SpecialNeedsSupport toDomain(SpecialNeedsSupportEntity entity) {
        return SpecialNeedsSupport.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .classroomId(entity.getClassroomId())
                .institutionId(entity.getInstitutionId())
                .academicYear(entity.getAcademicYear())
                .diagnosis(entity.getDiagnosis())
                .diagnosisDate(entity.getDiagnosisDate())
                .diagnosedBy(entity.getDiagnosedBy())
                .supportType(entity.getSupportType() != null ? SupportType.valueOf(entity.getSupportType()) : null)
                .description(entity.getDescription())
                .adaptationsRequired(entity.getAdaptationsRequired())
                .supportMaterials(entity.getSupportMaterials())
                .specialistInvolved(entity.getSpecialistInvolved())
                .progressNotes(entity.getProgressNotes())
                .lastReviewDate(entity.getLastReviewDate())
                .nextReviewDate(entity.getNextReviewDate())
                .status(entity.getStatus() != null ? EvaluationStatus.valueOf(entity.getStatus()) : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
