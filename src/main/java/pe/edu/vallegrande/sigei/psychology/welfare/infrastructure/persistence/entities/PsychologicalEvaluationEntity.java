package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table("psychological_evaluations")
public class PsychologicalEvaluationEntity {

    @Id
    private UUID id;

    @Column("student_id")
    private UUID studentId;

    @Column("classroom_id")
    private UUID classroomId;

    @Column("institution_id")
    private UUID institutionId;

    @Column("evaluation_date")
    private LocalDate evaluationDate;

    @Column("academic_year")
    private Integer academicYear;

    @Column("evaluation_type")
    private String evaluationType;

    @Column("evaluation_reason")
    private String evaluationReason;

    @Column("emotional_development")
    private String emotionalDevelopment;

    @Column("social_development")
    private String socialDevelopment;

    @Column("cognitive_development")
    private String cognitiveDevelopment;

    @Column("motor_development")
    private String motorDevelopment;

    @Column("observations")
    private String observations;

    @Column("recommendations")
    private String recommendations;

    @Column("requires_follow_up")
    private Boolean requiresFollowUp;

    @Column("follow_up_frequency")
    private String followUpFrequency;

    @Column("evaluated_by")
    private UUID evaluatedBy;

    @Column("evaluator_name")
    private String evaluatorName;

    @Column("updated_by")
    private String updatedBy;

    @Column("status")
    private String status;

    @Column("evaluated_at")
    private LocalDateTime evaluatedAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
