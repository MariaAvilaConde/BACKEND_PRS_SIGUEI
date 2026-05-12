package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IHardDeleteSpecialNeedsSupportUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HardDeleteSpecialNeedsSupportUseCaseImpl implements IHardDeleteSpecialNeedsSupportUseCase {

    private final ISpecialNeedsSupportRepository repository;

    @Override
    public Mono<Void> execute(UUID id) {
        return repository.deleteById(id)
                .doOnSuccess(v -> log.info("Soporte de necesidades especiales eliminado físicamente: {}", id));
    }
}
