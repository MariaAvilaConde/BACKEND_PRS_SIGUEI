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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteEvaluationUseCaseImpl — Pruebas unitarias")
class DeleteEvaluationUseCaseImplTest {

    @Mock
    private IPsychologicalEvaluationRepository repository;

    @InjectMocks
    private DeleteEvaluationUseCaseImpl useCase;

    private UUID evaluationId;
    private PsychologicalEvaluation activeEvaluation;

    @BeforeEach
    void setUp() {
        evaluationId = UUID.randomUUID();
        activeEvaluation = PsychologicalEvaluation.builder()
                .id(evaluationId)
                .studentId(UUID.randomUUID())
                .classroomId(UUID.randomUUID())
                .institutionId(UUID.randomUUID())
                .evaluationDate(LocalDate.now())
                .academicYear(2026)
                .evaluationType("INICIAL")
                .observations("Observaciones de prueba para eliminado lógico")
                .status("ACTIVE")
                .build();
    }

    // ── Caso positivo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_evaluacionActiva_debeDesactivarYRetornarConStatusINACTIVE")
    void execute_evaluacionActiva_debeDesactivarYRetornarConStatusINACTIVE() {
        PsychologicalEvaluation evaluacionDesactivada = PsychologicalEvaluation.builder()
                .id(evaluationId)
                .status("INACTIVE")
                .build();

        when(repository.findById(evaluationId)).thenReturn(Mono.just(activeEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class))).thenReturn(Mono.just(evaluacionDesactivada));

        StepVerifier.create(useCase.execute(evaluationId))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("INACTIVE");
                    assertThat(result.getId()).isEqualTo(evaluationId);
                })
                .verifyComplete();

        verify(repository, times(1)).findById(evaluationId);
        verify(repository, times(1)).save(any(PsychologicalEvaluation.class));
    }

    @Test
    @DisplayName("execute_evaluacionActiva_debeLlamarSaveConStatusINACTIVE")
    void execute_evaluacionActiva_debeLlamarSaveConStatusINACTIVE() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(activeEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class))).thenAnswer(inv -> {
            PsychologicalEvaluation saved = inv.getArgument(0);
            return Mono.just(saved);
        });

        StepVerifier.create(useCase.execute(evaluationId))
                .assertNext(result -> assertThat(result.getStatus()).isEqualTo("INACTIVE"))
                .verifyComplete();
    }

    // ── Caso negativo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_evaluacionInexistente_debeEmitirEvaluationNotFoundException")
    void execute_evaluacionInexistente_debeEmitirEvaluationNotFoundException() {
        UUID idInexistente = UUID.randomUUID();
        when(repository.findById(idInexistente)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.execute(idInexistente))
                .expectErrorMatches(error ->
                        error instanceof EvaluationNotFoundException &&
                        error.getMessage().contains(idInexistente.toString()))
                .verify();

        verify(repository, never()).save(any());
    }

    // ── Caso excepción ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_errorEnRepositorio_debePropagar_RuntimeException")
    void execute_errorEnRepositorio_debePropagar_RuntimeException() {
        when(repository.findById(evaluationId))
                .thenReturn(Mono.error(new RuntimeException("Error de conexión a la base de datos")));

        StepVerifier.create(useCase.execute(evaluationId))
                .expectErrorMatches(error ->
                        error instanceof RuntimeException &&
                        error.getMessage().contains("Error de conexión"))
                .verify();

        verify(repository, never()).save(any());
    }
}
