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
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.request.SpecialNeedsSupportRequest;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.SpecialNeedsSupportResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.application.mappers.SpecialNeedsSupportMapper;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/special-needs-support")
@RequiredArgsConstructor
@Tag(name = "Soporte de Necesidades Especiales", description = "API para gestión de apoyos de necesidades especiales")
public class SpecialNeedsSupportRest {

    private final ICreateSpecialNeedsSupportUseCase createUseCase;
    private final IGetSpecialNeedsSupportUseCase getUseCase;
    private final IUpdateSpecialNeedsSupportUseCase updateUseCase;
    private final IDeleteSpecialNeedsSupportUseCase deleteUseCase;
    private final IHardDeleteSpecialNeedsSupportUseCase hardDeleteUseCase;
    private final IRestoreSpecialNeedsSupportUseCase restoreUseCase;
    private final SpecialNeedsSupportMapper mapper;

    @GetMapping
    @Operation(summary = "Listar todos los soportes activos")
    public Mono<ResponseEntity<ApiResponse<List<SpecialNeedsSupportResponse>>>> findAllActive() {
        return getUseCase.findAllActive()
                .map(mapper::toResponse)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success(list, "Soportes activos obtenidos")));
    }

    @GetMapping("/all")
    @Operation(summary = "Listar todos los soportes (incluye inactivos)")
    public Mono<ResponseEntity<ApiResponse<List<SpecialNeedsSupportResponse>>>> findAll() {
        return getUseCase.findAll()
                .map(mapper::toResponse)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success(list, "Todos los soportes obtenidos")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener soporte por ID")
    public Mono<ResponseEntity<ApiResponse<SpecialNeedsSupportResponse>>> findById(@PathVariable UUID id) {
        return getUseCase.findById(id)
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Soporte encontrado")))
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Soporte no encontrado")));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo soporte")
    public Mono<ResponseEntity<ApiResponse<SpecialNeedsSupportResponse>>> create(@Valid @RequestBody SpecialNeedsSupportRequest request) {
        return createUseCase.execute(mapper.toDomain(request))
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success(response, "Soporte creado con éxito")));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar soporte")
    public Mono<ResponseEntity<ApiResponse<SpecialNeedsSupportResponse>>> update(
            @PathVariable UUID id,
            @Valid @RequestBody SpecialNeedsSupportRequest request) {
        return updateUseCase.execute(id, mapper.toDomain(request))
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Soporte actualizado con éxito")));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminado lógico (desactivar)")
    public Mono<ResponseEntity<ApiResponse<SpecialNeedsSupportResponse>>> delete(@PathVariable UUID id) {
        return deleteUseCase.execute(id)
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Soporte desactivado con éxito")));
    }

    @DeleteMapping("/{id}/hard")
    @Operation(summary = "Eliminado físico (borrar permanentemente)")
    public Mono<ResponseEntity<ApiResponse<Void>>> hardDelete(@PathVariable UUID id) {
        return hardDeleteUseCase.execute(id)
                .then(Mono.just(ResponseEntity.ok(ApiResponse.<Void>success(null, "Soporte eliminado permanentemente"))));
    }

    @PatchMapping("/{id}/restore")
    @Operation(summary = "Reactivar soporte")
    public Mono<ResponseEntity<ApiResponse<SpecialNeedsSupportResponse>>> restore(@PathVariable UUID id) {
        return restoreUseCase.execute(id)
                .map(mapper::toResponse)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Soporte reactivado con éxito")));
    }
}
