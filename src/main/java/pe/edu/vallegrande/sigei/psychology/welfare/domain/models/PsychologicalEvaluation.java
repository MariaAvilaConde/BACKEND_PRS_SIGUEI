package pe.edu.vallegrande.sigei.psychology.welfare.domain.models;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PsychologicalEvaluation {

    private UUID id;
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
    private UUID evaluatedBy;
    private String evaluatorName;
    private String updatedBy;
    private String status;
    private LocalDateTime evaluatedAt;
    private LocalDateTime updatedAt;
}
