package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response;

import lombok.*;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.EvaluationStatus;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.SupportType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialNeedsSupportResponse {

    private UUID id;
    private UUID studentId;
    private UUID classroomId;
    private UUID institutionId;
    private Integer academicYear;
    private String diagnosis;
    private LocalDate diagnosisDate;
    private String diagnosedBy;
    private SupportType supportType;
    private String description;
    private String[] adaptationsRequired;
    private String[] supportMaterials;
    private String specialistInvolved;
    private String progressNotes;
    private LocalDate lastReviewDate;
    private LocalDate nextReviewDate;
    private EvaluationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
