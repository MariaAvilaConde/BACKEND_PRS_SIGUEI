package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IUpdateSpecialNeedsSupportUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UpdateSpecialNeedsSupportUseCaseImpl implements IUpdateSpecialNeedsSupportUseCase {

    private final ISpecialNeedsSupportRepository repository;

    @Override
    public Mono<SpecialNeedsSupport> execute(UUID id, SpecialNeedsSupport support) {
        return repository.findById(id)
                .flatMap(existing -> {
                    support.setId(existing.getId());
                    support.setCreatedAt(existing.getCreatedAt());
                    support.setUpdatedAt(LocalDateTime.now());
                    support.setStatus(existing.getStatus());
                    return repository.save(support);
                })
                .doOnSuccess(updated -> log.info("Soporte de necesidades especiales actualizado: {}", id));
    }
}
