package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IDeleteSpecialNeedsSupportUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeleteSpecialNeedsSupportUseCaseImpl implements IDeleteSpecialNeedsSupportUseCase {

    private final ISpecialNeedsSupportRepository repository;

    @Override
    public Mono<SpecialNeedsSupport> execute(UUID id) {
        return repository.findById(id)
                .flatMap(support -> {
                    support.deactivate();
                    support.setUpdatedAt(LocalDateTime.now());
                    return repository.save(support);
                })
                .doOnSuccess(deleted -> log.info("Soporte de necesidades especiales desactivado (lógico): {}", id));
    }
}
