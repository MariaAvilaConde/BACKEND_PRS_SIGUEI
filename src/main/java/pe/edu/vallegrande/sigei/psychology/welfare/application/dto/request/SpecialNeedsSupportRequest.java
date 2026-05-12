package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.SupportType;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialNeedsSupportRequest {

    @NotNull
    private UUID studentId;
    @NotNull
    private UUID classroomId;
    @NotNull
    private UUID institutionId;
    @NotNull
    private Integer academicYear;

    private String diagnosis;
    private LocalDate diagnosisDate;
    private String diagnosedBy;

    @NotNull
    private SupportType supportType;
    private String description;

    private String[] adaptationsRequired;
    private String[] supportMaterials;

    private String specialistInvolved;
    private String progressNotes;

    private LocalDate lastReviewDate;
    private LocalDate nextReviewDate;
}
