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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RestoreEvaluationUseCaseImpl — Pruebas unitarias")
class RestoreEvaluationUseCaseImplTest {

    @Mock
    private IPsychologicalEvaluationRepository repository;

    @InjectMocks
    private RestoreEvaluationUseCaseImpl useCase;

    private UUID evaluationId;
    private PsychologicalEvaluation inactiveEvaluation;

    @BeforeEach
    void setUp() {
        evaluationId = UUID.randomUUID();
        inactiveEvaluation = PsychologicalEvaluation.builder()
                .id(evaluationId)
                .studentId(UUID.randomUUID())
                .evaluationType("SEGUIMIENTO")
                .observations("Evaluación previamente desactivada")
                .status("INACTIVE")
                .build();
    }

    // ── Caso positivo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_evaluacionInactiva_debeRestaurarYRetornarConStatusACTIVE")
    void execute_evaluacionInactiva_debeRestaurarYRetornarConStatusACTIVE() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(inactiveEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class))).thenAnswer(inv -> {
            PsychologicalEvaluation saved = inv.getArgument(0);
            return Mono.just(saved);
        });

        StepVerifier.create(useCase.execute(evaluationId))
                .assertNext(result -> {
                    assertThat(result.getStatus()).isEqualTo("ACTIVE");
                    assertThat(result.getUpdatedAt()).isNotNull();
                })
                .verifyComplete();

        verify(repository, times(1)).findById(evaluationId);
        verify(repository, times(1)).save(any(PsychologicalEvaluation.class));
    }

    @Test
    @DisplayName("execute_evaluacionInactiva_debeActualizarUpdatedAt")
    void execute_evaluacionInactiva_debeActualizarUpdatedAt() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(inactiveEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class))).thenAnswer(inv -> Mono.just((PsychologicalEvaluation) inv.getArgument(0)));

        StepVerifier.create(useCase.execute(evaluationId))
                .assertNext(result -> assertThat(result.getUpdatedAt()).isNotNull())
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
    @DisplayName("execute_errorAlGuardar_debePropagar_RuntimeException")
    void execute_errorAlGuardar_debePropagar_RuntimeException() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(inactiveEvaluation));
        when(repository.save(any(PsychologicalEvaluation.class)))
                .thenReturn(Mono.error(new RuntimeException("Fallo al persistir en base de datos")));

        StepVerifier.create(useCase.execute(evaluationId))
                .expectErrorMatches(error ->
                        error instanceof RuntimeException &&
                        error.getMessage().contains("Fallo al persistir"))
                .verify();
    }
}
