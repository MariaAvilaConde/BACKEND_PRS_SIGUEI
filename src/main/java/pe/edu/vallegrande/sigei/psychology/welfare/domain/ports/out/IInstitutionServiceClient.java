package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out;

import reactor.core.publisher.Mono;

public interface IInstitutionServiceClient {
    Mono<Boolean> existsInstitution(String institutionId);
}
