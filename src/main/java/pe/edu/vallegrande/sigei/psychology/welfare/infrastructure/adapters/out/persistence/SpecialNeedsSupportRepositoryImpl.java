package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.adapters.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.EvaluationStatus;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.mappers.SpecialNeedsSupportPersistenceMapper;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.repositories.SpecialNeedsSupportR2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class SpecialNeedsSupportRepositoryImpl implements ISpecialNeedsSupportRepository {

    private final SpecialNeedsSupportR2dbcRepository r2dbcRepository;
    private final SpecialNeedsSupportPersistenceMapper mapper;

    @Override
    public Flux<SpecialNeedsSupport> findAll() {
        return r2dbcRepository.findAll()
                .map(mapper::toDomain);
    }

    @Override
    public Flux<SpecialNeedsSupport> findByStatus(EvaluationStatus status) {
        return r2dbcRepository.findByStatus(status.name())
                .map(mapper::toDomain);
    }

    @Override
    public Mono<SpecialNeedsSupport> findById(UUID id) {
        return r2dbcRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public Mono<SpecialNeedsSupport> save(SpecialNeedsSupport support) {
        return r2dbcRepository.save(mapper.toEntity(support))
                .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbcRepository.deleteById(id);
    }
}
