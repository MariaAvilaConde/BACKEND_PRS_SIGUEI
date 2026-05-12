package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.repositories;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.persistence.entities.SpecialNeedsSupportEntity;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface SpecialNeedsSupportR2dbcRepository extends R2dbcRepository<SpecialNeedsSupportEntity, UUID> {
    Flux<SpecialNeedsSupportEntity> findByStatus(String status);
}
