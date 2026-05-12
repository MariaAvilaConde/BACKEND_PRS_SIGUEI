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

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("HardDeleteEvaluationUseCaseImpl — Pruebas unitarias")
class HardDeleteEvaluationUseCaseImplTest {

    @Mock
    private IPsychologicalEvaluationRepository repository;

    @InjectMocks
    private HardDeleteEvaluationUseCaseImpl useCase;

    private UUID evaluationId;
    private PsychologicalEvaluation evaluation;

    @BeforeEach
    void setUp() {
        evaluationId = UUID.randomUUID();
        evaluation = PsychologicalEvaluation.builder()
                .id(evaluationId)
                .studentId(UUID.randomUUID())
                .evaluationType("INICIAL")
                .status("INACTIVE")
                .build();
    }

    // ── Caso positivo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_evaluacionExistente_debeEliminarFisicamenteYCompletarSinEmitirValor")
    void execute_evaluacionExistente_debeEliminarFisicamenteYCompletarSinEmitirValor() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(evaluation));
        when(repository.deleteById(evaluationId)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.execute(evaluationId))
                .verifyComplete();

        verify(repository, times(1)).findById(evaluationId);
        verify(repository, times(1)).deleteById(evaluationId);
    }

    @Test
    @DisplayName("execute_evaluacionExistente_debeLlamarDeleteByIdConElIdCorrecto")
    void execute_evaluacionExistente_debeLlamarDeleteByIdConElIdCorrecto() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(evaluation));
        when(repository.deleteById(evaluationId)).thenReturn(Mono.empty());

        useCase.execute(evaluationId).block();

        verify(repository).deleteById(evaluationId);
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

        verify(repository, never()).deleteById(any());
    }

    // ── Caso excepción ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute_errorEnDeleteById_debePropagar_RuntimeException")
    void execute_errorEnDeleteById_debePropagar_RuntimeException() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(evaluation));
        when(repository.deleteById(evaluationId))
                .thenReturn(Mono.error(new RuntimeException("Error al eliminar registro de la base de datos")));

        StepVerifier.create(useCase.execute(evaluationId))
                .expectErrorMatches(error ->
                        error instanceof RuntimeException &&
                        error.getMessage().contains("Error al eliminar"))
                .verify();
    }
}
