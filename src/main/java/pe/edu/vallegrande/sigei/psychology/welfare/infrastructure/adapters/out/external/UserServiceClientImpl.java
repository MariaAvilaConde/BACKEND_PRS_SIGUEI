package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.adapters.out.external;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.common.ApiResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.UserResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IUserServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserServiceClientImpl implements IUserServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${microservices.users.url}")
    private String usersServiceUrl;

    @Override
    public Flux<UserResponse> getAllUsers() {
        return webClientBuilder.build()
                .get()
                .uri(usersServiceUrl + "/api/users")
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<ApiResponse<java.util.List<UserResponse>>>() {})
                .flatMapMany(response -> {
                    if (response.isSuccess() && response.getData() != null) {
                        return Flux.fromIterable(response.getData());
                    }
                    return Flux.empty();
                })
                .onErrorResume(error -> {
                    log.warn("Error fetching users - service may be unavailable: {}", error.getMessage());
                    return Flux.empty();
                });
    }

    @Override
    public Mono<UserResponse> getUserById(String userId) {
        return webClientBuilder.build()
                .get()
                .uri(usersServiceUrl + "/api/users/" + userId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<ApiResponse<UserResponse>>() {})
                .mapNotNull(response -> {
                    if (response.isSuccess()) {
                        return response.getData();
                    }
                    return null;
                })
                .onErrorResume(error -> {
                    log.warn("Error fetching user {} - service may be unavailable: {}", userId, error.getMessage());
                    return Mono.empty();
                });
    }
}
