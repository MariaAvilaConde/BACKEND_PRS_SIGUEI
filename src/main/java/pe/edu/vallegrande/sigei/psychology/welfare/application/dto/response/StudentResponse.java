package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {
    private String id;
    private String cui;
    private String firstName;
    private String lastName;
    private String motherLastName;
    private String institutionId;
    private String classroomId;
    private String status;
}
