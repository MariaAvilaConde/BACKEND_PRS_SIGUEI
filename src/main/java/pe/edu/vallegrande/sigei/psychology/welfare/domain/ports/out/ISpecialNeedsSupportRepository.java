package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out;

import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.EvaluationStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ISpecialNeedsSupportRepository {
    Flux<SpecialNeedsSupport> findAll();
    Flux<SpecialNeedsSupport> findByStatus(EvaluationStatus status);
    Mono<SpecialNeedsSupport> findById(UUID id);
    Mono<SpecialNeedsSupport> save(SpecialNeedsSupport support);
    Mono<Void> deleteById(UUID id);
}
