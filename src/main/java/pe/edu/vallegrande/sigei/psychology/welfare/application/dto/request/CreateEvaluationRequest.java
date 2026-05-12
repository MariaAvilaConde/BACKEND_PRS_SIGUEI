package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateEvaluationRequest {

    @NotNull(message = "El ID del estudiante es requerido")
    private UUID studentId;

    @NotNull(message = "El ID del aula es requerido")
    private UUID classroomId;

    @NotNull(message = "El ID de la institución es requerido")
    private UUID institutionId;

    @NotNull(message = "La fecha de evaluación es requerida")
    private LocalDate evaluationDate;

    @NotNull(message = "El año académico es requerido")
    private Integer academicYear;

    @NotBlank(message = "El tipo de evaluación es requerido")
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

    @NotNull(message = "El ID del evaluador es requerido")
    private UUID evaluatedBy;

    private String evaluatorName;

    /**
     * Si es true, la evaluación se crea con status SCHEDULED.
     * Los campos clínicos (observations, recommendations) no son obligatorios.
     */
    private Boolean scheduled;
}
