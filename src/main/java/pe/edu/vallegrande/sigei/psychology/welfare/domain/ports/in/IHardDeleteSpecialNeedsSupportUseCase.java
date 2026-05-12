package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in;

import reactor.core.publisher.Mono;

import java.util.UUID;

public interface IHardDeleteSpecialNeedsSupportUseCase {
    Mono<Void> execute(UUID id);
}
