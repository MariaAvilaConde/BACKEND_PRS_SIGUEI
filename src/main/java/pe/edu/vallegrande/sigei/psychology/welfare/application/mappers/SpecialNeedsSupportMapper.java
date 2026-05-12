package pe.edu.vallegrande.sigei.psychology.welfare.application.mappers;

import org.springframework.stereotype.Component;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request.SpecialNeedsSupportRequest;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.SpecialNeedsSupportResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;

import java.time.LocalDateTime;

@Component
public class SpecialNeedsSupportMapper {

    public SpecialNeedsSupport toDomain(SpecialNeedsSupportRequest request) {
        return SpecialNeedsSupport.builder()
                .studentId(request.getStudentId())
                .classroomId(request.getClassroomId())
                .institutionId(request.getInstitutionId())
                .academicYear(request.getAcademicYear())
                .diagnosis(request.getDiagnosis())
                .diagnosisDate(request.getDiagnosisDate())
                .diagnosedBy(request.getDiagnosedBy())
                .supportType(request.getSupportType())
                .description(request.getDescription())
                .adaptationsRequired(request.getAdaptationsRequired())
                .supportMaterials(request.getSupportMaterials())
                .specialistInvolved(request.getSpecialistInvolved())
                .progressNotes(request.getProgressNotes())
                .lastReviewDate(request.getLastReviewDate())
                .nextReviewDate(request.getNextReviewDate())
                .build();
    }

    public SpecialNeedsSupportResponse toResponse(SpecialNeedsSupport domain) {
        return SpecialNeedsSupportResponse.builder()
                .id(domain.getId())
                .studentId(domain.getStudentId())
                .classroomId(domain.getClassroomId())
                .institutionId(domain.getInstitutionId())
                .academicYear(domain.getAcademicYear())
                .diagnosis(domain.getDiagnosis())
                .diagnosisDate(domain.getDiagnosisDate())
                .diagnosedBy(domain.getDiagnosedBy())
                .supportType(domain.getSupportType())
                .description(domain.getDescription())
                .adaptationsRequired(domain.getAdaptationsRequired())
                .supportMaterials(domain.getSupportMaterials())
                .specialistInvolved(domain.getSpecialistInvolved())
                .progressNotes(domain.getProgressNotes())
                .lastReviewDate(domain.getLastReviewDate())
                .nextReviewDate(domain.getNextReviewDate())
                .status(domain.getStatus())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }
}
