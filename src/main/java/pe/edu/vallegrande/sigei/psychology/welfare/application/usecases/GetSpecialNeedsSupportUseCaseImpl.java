package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.EvaluationStatus;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.IGetSpecialNeedsSupportUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetSpecialNeedsSupportUseCaseImpl implements IGetSpecialNeedsSupportUseCase {

    private final ISpecialNeedsSupportRepository repository;

    @Override
    public Flux<SpecialNeedsSupport> findAll() {
        return repository.findAll();
    }

    @Override
    public Flux<SpecialNeedsSupport> findAllActive() {
        return repository.findByStatus(EvaluationStatus.ACTIVE);
    }

    @Override
    public Mono<SpecialNeedsSupport> findById(UUID id) {
        return repository.findById(id);
    }
}
