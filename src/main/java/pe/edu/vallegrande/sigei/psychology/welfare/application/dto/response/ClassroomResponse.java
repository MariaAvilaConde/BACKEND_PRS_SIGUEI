package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomResponse {
    private String id;
    private String institutionId;
    
    @JsonProperty("classroomName")
    private String classroomName;
    
    @JsonProperty("classroomAge")
    private String classroomAge;
    
    private Integer capacity;
    private String color;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
