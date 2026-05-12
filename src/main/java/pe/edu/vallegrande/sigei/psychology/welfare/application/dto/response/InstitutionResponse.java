package pe.edu.vallegrande.sigei.psychology.welfare.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionResponse {
    private String id;
    private String codeInstitution;
    private String modularCode;
    private String name;
    private String institutionType;
    private String institutionLevel;
    private String gender;
    private String slogan;
    private String logoUrl;
    private AddressInfo address;
    private List<ContactMethod> contactMethods;
    private List<Schedule> schedules;
    private String gradingType;
    private String classroomType;
    private String ugel;
    private String dre;
    private String directorId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressInfo {
        private String department;
        private String province;
        private String district;
        private String urbanization;
        private String reference;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactMethod {
        private String type;
        private String value;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Schedule {
        private String shift;
        private String startTime;
        private String endTime;
    }
}
