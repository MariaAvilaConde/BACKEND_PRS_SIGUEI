package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IRestoreSpecialNeedsSupportUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestoreSpecialNeedsSupportUseCaseImpl implements IRestoreSpecialNeedsSupportUseCase {

    private final ISpecialNeedsSupportRepository repository;

    @Override
    public Mono<SpecialNeedsSupport> execute(UUID id) {
        return repository.findById(id)
                .flatMap(support -> {
                    support.activate();
                    support.setUpdatedAt(LocalDateTime.now());
                    return repository.save(support);
                })
                .doOnSuccess(restored -> log.info("Soporte de necesidades especiales restaurado: {}", id));
    }
}
