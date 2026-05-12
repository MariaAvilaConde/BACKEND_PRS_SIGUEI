package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out;

import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.UserResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface IUserServiceClient {
    Flux<UserResponse> getAllUsers();
    Mono<UserResponse> getUserById(String userId);
}
