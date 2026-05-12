package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface IDeleteSpecialNeedsSupportUseCase {
    Mono<SpecialNeedsSupport> execute(UUID id);
}
