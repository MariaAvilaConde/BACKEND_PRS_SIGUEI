package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.UserResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.PsychologicalEvaluation;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IPsychologicalEvaluationRepository;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IUserServiceClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateEvaluationUseCaseImplTest {

    @Mock
    private IPsychologicalEvaluationRepository repository;

    @Mock
    private IUserServiceClient userServiceClient;

    @InjectMocks
    private CreateEvaluationUseCaseImpl useCase;

    private PsychologicalEvaluation evaluation;

    @BeforeEach
    void setUp() {
        evaluation = PsychologicalEvaluation.builder()
                .studentId(UUID.randomUUID())
                .classroomId(UUID.randomUUID())
                .institutionId(UUID.randomUUID())
                .evaluationDate(LocalDate.now())
                .academicYear(2025)
                .evaluationType("INICIAL")
                .observations("Observaciones de prueba")
                .status("ACTIVE")
                .build();
    }

    @Test
    void execute_sinEvaluador_debeGuardarDirectamente() {
        PsychologicalEvaluation saved = PsychologicalEvaluation.builder()
                .id(UUID.randomUUID())
                .studentId(evaluation.getStudentId())
                .status("ACTIVE")
                .build();

        when(repository.save(any())).thenReturn(Mono.just(saved));

        StepVerifier.create(useCase.execute(evaluation))
                .expectNextMatches(result -> result.getId() != null)
                .verifyComplete();
    }

    @Test
    void execute_conEvaluador_debeObtenerNombreYGuardar() {
        UUID evaluadorId = UUID.randomUUID();
        evaluation.setEvaluatedBy(evaluadorId);

        UserResponse user = new UserResponse();
        user.setFirstName("Juan");
        user.setLastName("Pérez");

        PsychologicalEvaluation saved = PsychologicalEvaluation.builder()
                .id(UUID.randomUUID())
                .evaluatedBy(evaluadorId)
                .evaluatorName("Juan Pérez")
                .status("ACTIVE")
                .build();

        when(userServiceClient.getUserById(evaluadorId.toString())).thenReturn(Mono.just(user));
        when(repository.save(any())).thenReturn(Mono.just(saved));

        StepVerifier.create(useCase.execute(evaluation))
                .expectNextMatches(result -> result.getId() != null)
                .verifyComplete();
    }

    @Test
    void execute_conEvaluadorNoDisponible_debeGuardarIgual() {
        UUID evaluadorId = UUID.randomUUID();
        evaluation.setEvaluatedBy(evaluadorId);

        PsychologicalEvaluation saved = PsychologicalEvaluation.builder()
                .id(UUID.randomUUID())
                .status("ACTIVE")
                .build();

        when(userServiceClient.getUserById(evaluadorId.toString()))
                .thenReturn(Mono.error(new RuntimeException("Servicio no disponible")));
        when(repository.save(any())).thenReturn(Mono.just(saved));

        StepVerifier.create(useCase.execute(evaluation))
                .expectNextMatches(result -> result.getId() != null)
                .verifyComplete();
    }
}
