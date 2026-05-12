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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetEvaluationUseCaseImpl — Pruebas unitarias")
class GetEvaluationUseCaseImplTest {

    @Mock
    private IPsychologicalEvaluationRepository repository;

    @InjectMocks
    private GetEvaluationUseCaseImpl useCase;

    private UUID evaluationId;
    private PsychologicalEvaluation evaluation;

    @BeforeEach
    void setUp() {
        evaluationId = UUID.randomUUID();
        evaluation = PsychologicalEvaluation.builder()
                .id(evaluationId)
                .studentId(UUID.randomUUID())
                .classroomId(UUID.randomUUID())
                .institutionId(UUID.randomUUID())
                .evaluationDate(LocalDate.of(2026, 3, 13))
                .academicYear(2026)
                .evaluationType("INICIAL")
                .observations("Observaciones de prueba")
                .evaluatorName("Vidal Luyo")
                .status("ACTIVE")
                .build();
    }

    // ── findById ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById_idExistente_debeRetornarEvaluacion")
    void findById_idExistente_debeRetornarEvaluacion() {
        when(repository.findById(evaluationId)).thenReturn(Mono.just(evaluation));

        StepVerifier.create(useCase.findById(evaluationId))
                .assertNext(result -> {
                    assertThat(result.getId()).isEqualTo(evaluationId);
                    assertThat(result.getEvaluationType()).isEqualTo("INICIAL");
                    assertThat(result.getStatus()).isEqualTo("ACTIVE");
                    assertThat(result.getEvaluatorName()).isEqualTo("Vidal Luyo");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("findById_idInexistente_debeEmitirEvaluationNotFoundException")
    void findById_idInexistente_debeEmitirEvaluationNotFoundException() {
        UUID idInexistente = UUID.randomUUID();
        when(repository.findById(idInexistente)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.findById(idInexistente))
                .expectErrorMatches(error ->
                        error instanceof EvaluationNotFoundException &&
                        error.getMessage().contains(idInexistente.toString()))
                .verify();
    }

    // ── findAll ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll_conRegistros_debeRetornarTodasLasEvaluaciones")
    void findAll_conRegistros_debeRetornarTodasLasEvaluaciones() {
        PsychologicalEvaluation segunda = PsychologicalEvaluation.builder()
                .id(UUID.randomUUID())
                .evaluationType("SEGUIMIENTO")
                .status("INACTIVE")
                .build();

        when(repository.findAll()).thenReturn(Flux.just(evaluation, segunda));

        StepVerifier.create(useCase.findAll())
                .assertNext(r -> assertThat(r.getStatus()).isEqualTo("ACTIVE"))
                .assertNext(r -> assertThat(r.getStatus()).isEqualTo("INACTIVE"))
                .verifyComplete();
    }

    @Test
    @DisplayName("findAll_sinRegistros_debeRetornarFluxVacio")
    void findAll_sinRegistros_debeRetornarFluxVacio() {
        when(repository.findAll()).thenReturn(Flux.empty());

        StepVerifier.create(useCase.findAll())
                .verifyComplete();
    }

    // ── findByStudentId ────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByStudentId_estudianteConEvaluaciones_debeRetornarSuHistorial")
    void findByStudentId_estudianteConEvaluaciones_debeRetornarSuHistorial() {
        UUID studentId = evaluation.getStudentId();
        when(repository.findByStudentId(studentId)).thenReturn(Flux.just(evaluation));

        StepVerifier.create(useCase.findByStudentId(studentId))
                .assertNext(r -> assertThat(r.getStudentId()).isEqualTo(studentId))
                .verifyComplete();
    }

    @Test
    @DisplayName("findByStudentId_estudianteSinEvaluaciones_debeRetornarFluxVacio")
    void findByStudentId_estudianteSinEvaluaciones_debeRetornarFluxVacio() {
        UUID studentId = UUID.randomUUID();
        when(repository.findByStudentId(studentId)).thenReturn(Flux.empty());

        StepVerifier.create(useCase.findByStudentId(studentId))
                .verifyComplete();
    }
}
