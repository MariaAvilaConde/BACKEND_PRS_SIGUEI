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
@Table("special_needs_support")
public class SpecialNeedsSupportEntity {

    @Id
    private UUID id;

    @Column("student_id")
    private UUID studentId;

    @Column("classroom_id")
    private UUID classroomId;

    @Column("institution_id")
    private UUID institutionId;

    @Column("academic_year")
    private Integer academicYear;

    @Column("diagnosis")
    private String diagnosis;

    @Column("diagnosis_date")
    private LocalDate diagnosisDate;

    @Column("diagnosed_by")
    private String diagnosedBy;

    @Column("support_type")
    private String supportType;

    @Column("description")
    private String description;

    @Column("adaptations_required")
    private String[] adaptationsRequired;

    @Column("support_materials")
    private String[] supportMaterials;

    @Column("specialist_involved")
    private String specialistInvolved;

    @Column("progress_notes")
    private String progressNotes;

    @Column("last_review_date")
    private LocalDate lastReviewDate;

    @Column("next_review_date")
    private LocalDate nextReviewDate;

    @Column("status")
    private String status;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
