export const GUARDIAN_RELATIONSHIPS = [
     { value: "PADRE", label: "Padre" },
     { value: "MADRE", label: "Madre" },
     { value: "APODERADO", label: "Apoderado" },
     { value: "TIO", label: "Tío/a" },
     { value: "ABUELO", label: "Abuelo/a" },
     { value: "HERMANO", label: "Hermano/a" },
     { value: "OTRO", label: "Otro" },
];

export function createEmptyGuardian() {
     return {
          id: null,
          studentId: "",
          firstName: "",
          lastName: "",
          motherLastName: "",
          relationship: "",
          documentType: "DNI",
          documentNumber: "",
          phone: "",
          email: "",
          isEmergencyContact: false,
          whatsapp: "",
     };
}

export function formatGuardianForApi(guardian) {
     const payload = {
          studentId: guardian.studentId,
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          relationship: guardian.relationship,
          documentType: guardian.documentType,
          documentNumber: guardian.documentNumber,
          phone: guardian.phone,
          isEmergencyContact: guardian.isEmergencyContact || false,
     };

     if (guardian.motherLastName) payload.motherLastName = guardian.motherLastName;
     if (guardian.email) payload.email = guardian.email;
     if (guardian.whatsapp) payload.whatsapp = guardian.whatsapp;

     return payload;
}

export function formatGuardianUpdateForApi(guardian) {
     const payload = {};
     const fields = [
          "firstName", "lastName", "motherLastName", "relationship",
          "documentType", "documentNumber", "phone", "email",
          "isEmergencyContact", "whatsapp",
     ];

     fields.forEach((field) => {
          if (guardian[field] !== undefined && guardian[field] !== null) {
               payload[field] = guardian[field];
          }
     });

     return payload;
}

export function parseGuardianFromApi(data) {
     return {
          id: data.id,
          studentId: data.studentId || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          motherLastName: data.motherLastName || "",
          relationship: data.relationship || "",
          documentType: data.documentType || "DNI",
          documentNumber: data.documentNumber || "",
          phone: data.phone || "",
          email: data.email || "",
          isEmergencyContact: data.isEmergencyContact || data.emergencyContact || false,
          whatsapp: data.whatsapp || "",
          status: data.status || "A",
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
     };
}
