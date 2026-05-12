package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.adapters.out.external;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.common.ApiResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.InstitutionResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IInstitutionServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class InstitutionServiceClientImpl implements IInstitutionServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${microservices.institutions.url}")
    private String institutionsServiceUrl;

    @Override
    public Mono<Boolean> existsInstitution(String institutionId) {
        return webClientBuilder.build()
                .get()
                .uri(institutionsServiceUrl + "/api/institutions/" + institutionId)
                .retrieve()
                .bodyToMono(ApiResponse.class)
                .map(response -> response.isSuccess())
                .onErrorReturn(false)
                .doOnSuccess(exists -> log.debug("Institution {} exists: {}", institutionId, exists));
    }

    public Flux<InstitutionResponse> getAllInstitutions() {
        return webClientBuilder.build()
                .get()
                .uri(institutionsServiceUrl + "/api/institutions")
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<ApiResponse<java.util.List<InstitutionResponse>>>() {})
                .flatMapMany(response -> {
                    if (response.isSuccess() && response.getData() != null) {
                        return Flux.fromIterable(response.getData());
                    }
                    return Flux.empty();
                })
                .doOnError(error -> log.error("Error fetching institutions", error));
    }

    public Mono<InstitutionResponse> getInstitutionById(String institutionId) {
        return webClientBuilder.build()
                .get()
                .uri(institutionsServiceUrl + "/api/institutions/" + institutionId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<ApiResponse<InstitutionResponse>>() {})
                .mapNotNull(response -> {
                    if (response.isSuccess()) {
                        return response.getData();
                    }
                    return null;
                })
                .doOnError(error -> log.error("Error fetching institution {}", institutionId, error));
    }
}
