package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.adapters.out.external;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.common.ApiResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response.StudentResponse;
import pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out.IStudentServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class StudentServiceClientImpl implements IStudentServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${microservices.students.url}")
    private String studentsServiceUrl;

    @Override
    public Mono<Boolean> existsStudent(String studentId) {
        return webClientBuilder.build()
                .get()
                .uri(studentsServiceUrl + "/api/students/" + studentId)
                .retrieve()
                .bodyToMono(ApiResponse.class)
                .map(response -> response.isSuccess())
                .onErrorReturn(false)
                .doOnSuccess(exists -> log.debug("Student {} exists: {}", studentId, exists));
    }

    public Flux<StudentResponse> getAllStudents() {
        return webClientBuilder.build()
                .get()
                .uri(studentsServiceUrl + "/api/students")
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<ApiResponse<java.util.List<StudentResponse>>>() {})
                .flatMapMany(response -> {
                    if (response.isSuccess() && response.getData() != null) {
                        return Flux.fromIterable(response.getData());
                    }
                    return Flux.empty();
                })
                .doOnError(error -> log.error("Error fetching students", error));
    }

    public Mono<StudentResponse> getStudentById(String studentId) {
        return webClientBuilder.build()
                .get()
                .uri(studentsServiceUrl + "/api/students/" + studentId)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<ApiResponse<StudentResponse>>() {})
                .mapNotNull(response -> {
                    if (response.isSuccess()) {
                        return response.getData();
                    }
                    return null;
                })
                .doOnError(error -> log.error("Error fetching student {}", studentId, error));
    }
}
