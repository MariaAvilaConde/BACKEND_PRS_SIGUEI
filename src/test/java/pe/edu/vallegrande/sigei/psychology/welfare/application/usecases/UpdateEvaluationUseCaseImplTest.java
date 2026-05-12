package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions.EvaluationNotFoundException;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateEvaluationUseCaseImpl — Pruebas unitarias")
class UpdateEvaluationUseCaseImplTest {

    @Mock
    private IPsychologicalEvaluationRepository repository;

    @InjectMocks
    private UpdateEvaluationUseCaseImpl useCase;

    private UUID evaluationId;
    private PsychologicalEvaluation existingEvaluation;

    @BeforeEach
    void setUp() {
        evaluationId = UUID.randomUUID();
        existingEvaluation = PsychologicalEvaluation.builder()
                .id(evaluationId)
                .studentId(UUID.randomUUID())
                .classroomId(UUID.randomUUID())
                .institutionId(UUID.randomUUID())
                .evaluationDate(LocalDate.of(2026, 1, 10))
                .academicYear(2026)
                .evaluationType("INICIAL")
                .observations("Observaciones originales")
                .recommendations("Recomendaciones originales")
                .evaluatorName("Evaluador Original")
                .status("ACTIVE")
                .build();
    }

    // ── Caso positivo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_actualizacionParcial_debeAplicarSoloCamposNoNulos")
    void execute_actualizacionParcial_debeAplicarSoloCamposNoNulos() {
        PsychologicalEvaluation updates = PsychologicalEvaluation.builder()
                .evaluationType("SEGUIMIENTO")
                .observations("Observaciones actualizadas")
                .updatedAt(LocalDateTime.now())
                .build();

        when(repository.findById(evaluationId)).thenReturn(Mono.just(existingEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class))).thenAnswer(inv -> Mono.just((PsychologicalEvaluation) inv.getArgument(0)));

        StepVerifier.create(useCase.execute(evaluationId, updates))
                .assertNext(result -> {
                    assertThat(result.getEvaluationType()).isEqualTo("SEGUIMIENTO");
                    assertThat(result.getObservations()).isEqualTo("Observaciones actualizadas");
                    // Campos no enviados deben conservar su valor original
                    assertThat(result.getEvaluatorName()).isEqualTo("Evaluador Original");
                    assertThat(result.getStatus()).isEqualTo("ACTIVE");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("execute_actualizacionCompleta_debeActualizarTodosLosCampos")
    void execute_actualizacionCompleta_debeActualizarTodosLosCampos() {
        UUID nuevoStudentId = UUID.randomUUID();
        PsychologicalEvaluation updates = PsychologicalEvaluation.builder()
                .studentId(nuevoStudentId)
                .evaluationType("ESPECIAL")
                .observations("Nuevas observaciones completas")
                .recommendations("Nuevas recomendaciones")
                .evaluatorName("Nuevo Evaluador")
                .updatedAt(LocalDateTime.now())
                .build();

        when(repository.findById(evaluationId)).thenReturn(Mono.just(existingEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class))).thenAnswer(inv -> Mono.just((PsychologicalEvaluation) inv.getArgument(0)));

        StepVerifier.create(useCase.execute(evaluationId, updates))
                .assertNext(result -> {
                    assertThat(result.getStudentId()).isEqualTo(nuevoStudentId);
                    assertThat(result.getEvaluationType()).isEqualTo("ESPECIAL");
                    assertThat(result.getEvaluatorName()).isEqualTo("Nuevo Evaluador");
                    assertThat(result.getUpdatedAt()).isNotNull();
                })
                .verifyComplete();

        verify(repository, times(1)).save(any(PsychologicalEvaluation.class));
    }

    // ── Caso negativo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_evaluacionInexistente_debeEmitirEvaluationNotFoundException")
    void execute_evaluacionInexistente_debeEmitirEvaluationNotFoundException() {
        UUID idInexistente = UUID.randomUUID();
        PsychologicalEvaluation updates = PsychologicalEvaluation.builder()
                .evaluationType("DERIVACION")
                .build();

        when(repository.findById(idInexistente)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.execute(idInexistente, updates))
                .expectErrorMatches(error ->
                        error instanceof EvaluationNotFoundException &&
                        error.getMessage().contains(idInexistente.toString()))
                .verify();

        verify(repository, never()).save(any());
    }

    // ── Caso excepción ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_errorAlGuardar_debePropagar_RuntimeException")
    void execute_errorAlGuardar_debePropagar_RuntimeException() {
        PsychologicalEvaluation updates = PsychologicalEvaluation.builder()
                .observations("Observaciones de prueba")
                .updatedAt(LocalDateTime.now())
                .build();

        when(repository.findById(evaluationId)).thenReturn(Mono.just(existingEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class)))
                .thenReturn(Mono.error(new RuntimeException("Timeout al guardar en base de datos")));

        StepVerifier.create(useCase.execute(evaluationId, updates))
                .expectErrorMatches(error ->
                        error instanceof RuntimeException &&
                        error.getMessage().contains("Timeout al guardar"))
                .verify();
    }
}
