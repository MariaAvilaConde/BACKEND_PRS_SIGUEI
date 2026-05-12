package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface IGetSpecialNeedsSupportUseCase {
    Flux<SpecialNeedsSupport> findAll();
    Flux<SpecialNeedsSupport> findAllActive();
    Mono<SpecialNeedsSupport> findById(UUID id);
}
