package pe.edu.vallegrande.sigei.psychology.welfare.application.usecases;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.SpecialNeedsSupport;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.models.valueobjects.EvaluationStatus;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.in.ICreateSpecialNeedsSupportUseCase;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.ISpecialNeedsSupportRepository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreateSpecialNeedsSupportUseCaseImpl implements ICreateSpecialNeedsSupportUseCase {

    private final ISpecialNeedsSupportRepository repository;

    @Override
    public Mono<SpecialNeedsSupport> execute(SpecialNeedsSupport support) {
        support.setId(null);
        support.setStatus(EvaluationStatus.ACTIVE);
        support.setCreatedAt(LocalDateTime.now());
        support.setUpdatedAt(LocalDateTime.now());
        return repository.save(support)
                .doOnSuccess(saved -> log.info("Soporte de necesidades especiales creado: {}", saved.getId()));
    }
}
