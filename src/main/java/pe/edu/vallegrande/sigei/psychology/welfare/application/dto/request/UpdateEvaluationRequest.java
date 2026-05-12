package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEvaluationRequest {
    private UUID studentId;
    private UUID classroomId;
    private UUID institutionId;
    private LocalDate evaluationDate;
    private Integer academicYear;
    private String evaluationType;
    private String evaluationReason;
    private String emotionalDevelopment;
    private String socialDevelopment;
    private String cognitiveDevelopment;
    private String motorDevelopment;
    private String observations;
    private String recommendations;
    private Boolean requiresFollowUp;
    private String followUpFrequency;
    private String evaluatorName;
    private String updatedBy;
}
