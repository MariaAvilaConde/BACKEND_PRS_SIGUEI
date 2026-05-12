package pe.edu.vallegrande.sigei.psychology.welfare.domain.ports.out;

import reactor.core.publisher.Mono;

public interface IStudentServiceClient {
    Mono<Boolean> existsStudent(String studentId);
}
