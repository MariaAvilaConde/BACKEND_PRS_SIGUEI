package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import reactor.core.publisher.Mono;

public interface ICreateSpecialNeedsSupportUseCase {
    Mono<SpecialNeedsSupport> execute(SpecialNeedsSupport support);
}
