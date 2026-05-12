package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.adapters.in.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.common.ApiResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request.CreateEvaluationRequest;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request.UpdateEvaluationRequest;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.EvaluationResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.application.mappers.EvaluationMapper;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/psychological-evaluations")
@RequiredArgsConstructor
@Tag(name = "Evaluaciones Psicológicas", description = "API para gestión de evaluaciones psicológicas")
public class PsychologicalEvaluationRest {

    private final ICreateEvaluationUseCase createUseCase;
    private final IGetEvaluationUseCase getUseCase;
    private final IUpdateEvaluationUseCase updateUseCase;
    private final IDeleteEvaluationUseCase deleteUseCase;
    private final IHardDeleteEvaluationUseCase hardDeleteUseCase;
    private final IRestoreEvaluationUseCase restoreUseCase;
    private final IStartScheduledSessionUseCase startScheduledUseCase;
    private final EvaluationMapper mapper;

    @GetMapping
    @Operation(summary = "Listar todas las evaluaciones")
    public Mono<ResponseEntity<ApiResponse<List<EvaluationResponse>>>> findAll() {
        return getUseCase.findAll()
                .map(mapper::toResponse)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success(list, "Evaluaciones obtenidas")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener evaluación por ID")
    public Mono<ResponseEntity<ApiResponse<EvaluationResponse>>> findById(@PathVariable UUID id) {
        return getUseCase.findById(id)
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Evaluación encontrada")));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Obtener evaluaciones por estudiante")
    public Mono<ResponseEntity<ApiResponse<List<EvaluationResponse>>>> findByStudentId(@PathVariable UUID studentId) {
        return getUseCase.findByStudentId(studentId)
                .map(mapper::toResponse)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success(list, "Evaluaciones del estudiante")));
    }

    @GetMapping("/institution/{institutionId}")
    @Operation(summary = "Obtener evaluaciones por institución")
    public Mono<ResponseEntity<ApiResponse<List<EvaluationResponse>>>> findByInstitutionId(@PathVariable UUID institutionId) {
        return getUseCase.findByInstitutionId(institutionId)
                .map(mapper::toResponse)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success(list, "Evaluaciones de la institución")));
    }

    @GetMapping("/classroom/{classroomId}")
    @Operation(summary = "Obtener evaluaciones por aula")
    public Mono<ResponseEntity<ApiResponse<List<EvaluationResponse>>>> findByClassroomId(@PathVariable UUID classroomId) {
        return getUseCase.findByClassroomId(classroomId)
                .map(mapper::toResponse)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success(list, "Evaluaciones del aula")));
    }

    @PostMapping
    @Operation(summary = "Crear nueva evaluación")
    public Mono<ResponseEntity<ApiResponse<EvaluationResponse>>> create(@Valid @RequestBody CreateEvaluationRequest request) {
        return createUseCase.execute(mapper.toDomain(request))
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success(response, "Evaluación creada")));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar evaluación")
    public Mono<ResponseEntity<ApiResponse<EvaluationResponse>>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEvaluationRequest request) {
        return updateUseCase.execute(id, mapper.mapUpdateToDomain(request))
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Evaluación actualizada")));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminado lógico — desactiva la evaluación (PSICOLOGO / ADMIN)")
    public Mono<ResponseEntity<ApiResponse<EvaluationResponse>>> delete(@PathVariable UUID id) {
        return deleteUseCase.execute(id)
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Evaluación desactivada")));
    }

    @DeleteMapping("/{id}/hard")
    @Operation(summary = "Eliminado físico — borra permanentemente (solo ADMIN)")
    public Mono<ResponseEntity<ApiResponse<Void>>> hardDelete(@PathVariable UUID id) {
        return hardDeleteUseCase.execute(id)
                .then(Mono.just(ResponseEntity.ok(ApiResponse.<Void>success(null, "Evaluación eliminada permanentemente"))));
    }

    @PatchMapping("/{id}/restore")
    @Operation(summary = "Restaurar evaluación")
    public Mono<ResponseEntity<ApiResponse<EvaluationResponse>>> restore(@PathVariable UUID id) {
        return restoreUseCase.execute(id)
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Evaluación restaurada")));
    }

    @PatchMapping("/{id}/start")
    @Operation(summary = "Iniciar sesión programada — cambia SCHEDULED → ACTIVE")
    public Mono<ResponseEntity<ApiResponse<EvaluationResponse>>> startScheduled(
            @PathVariable UUID id,
            @RequestBody UpdateEvaluationRequest request) {
        return startScheduledUseCase.execute(id, mapper.mapUpdateToDomain(request))
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Sesión iniciada")));
    }
}
