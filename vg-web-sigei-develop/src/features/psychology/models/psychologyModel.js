export const EVALUATION_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
};

export const EVALUATION_STATUS_LABELS = {
     [EVALUATION_STATUS.ACTIVE]: "Activa",
     [EVALUATION_STATUS.INACTIVE]: "Inactiva",
};

export const EVALUATION_TYPES = [
     { value: "INICIAL", label: "Inicial" },
     { value: "SEGUIMIENTO", label: "Seguimiento" },
     { value: "ESPECIAL", label: "Especial" },
     { value: "DERIVACION", label: "Derivación" },
];

export const FOLLOW_UP_FREQUENCIES = [
     { value: "SEMANAL", label: "Semanal" },
     { value: "QUINCENAL", label: "Quincenal" },
     { value: "MENSUAL", label: "Mensual" },
     { value: "BIMESTRAL", label: "Bimestral" },
];

export function createEmptyEvaluation() {
     return {
          id: null,
          studentId: "",
          classroomId: "",
          institutionId: "",
          evaluationDate: "",
          academicYear: new Date().getFullYear(),
          evaluationType: "",
          evaluationReason: "",
          emotionalDevelopment: "",
          socialDevelopment: "",
          cognitiveDevelopment: "",
          motorDevelopment: "",
          observations: "",
          recommendations: "",
          requiresFollowUp: false,
          followUpFrequency: "",
          evaluatedBy: "",
          evaluatorName: "",
          status: EVALUATION_STATUS.ACTIVE,
     };
}

export function formatEvaluationForApi(evaluation) {
     return {
          studentId: evaluation.studentId,
          classroomId: evaluation.classroomId || undefined,
          institutionId: evaluation.institutionId || undefined,
          evaluationDate: evaluation.evaluationDate,
          academicYear: evaluation.academicYear,
          evaluationType: evaluation.evaluationType,
          evaluationReason: evaluation.evaluationReason || undefined,
          emotionalDevelopment: evaluation.emotionalDevelopment || undefined,
          socialDevelopment: evaluation.socialDevelopment || undefined,
          cognitiveDevelopment: evaluation.cognitiveDevelopment || undefined,
          motorDevelopment: evaluation.motorDevelopment || undefined,
          observations: evaluation.observations || undefined,
          recommendations: evaluation.recommendations || undefined,
          requiresFollowUp: evaluation.requiresFollowUp || false,
          followUpFrequency: evaluation.followUpFrequency || undefined,
          evaluatedBy: evaluation.evaluatedBy || undefined,
          evaluatorName: evaluation.evaluatorName || undefined,
          updatedBy: evaluation.updatedBy || undefined,
     };
}

export function parseEvaluationFromApi(apiData) {
     return {
          id: apiData.id,
          studentId: apiData.studentId || "",
          classroomId: apiData.classroomId || "",
          institutionId: apiData.institutionId || "",
          evaluationDate: apiData.evaluationDate || "",
          academicYear: apiData.academicYear || new Date().getFullYear(),
          evaluationType: apiData.evaluationType || "",
          evaluationReason: apiData.evaluationReason || "",
          emotionalDevelopment: apiData.emotionalDevelopment || "",
          socialDevelopment: apiData.socialDevelopment || "",
          cognitiveDevelopment: apiData.cognitiveDevelopment || "",
          motorDevelopment: apiData.motorDevelopment || "",
          observations: apiData.observations || "",
          recommendations: apiData.recommendations || "",
          requiresFollowUp: apiData.requiresFollowUp || false,
          updatedBy: apiData.updatedBy || "",
          evaluatedBy: apiData.evaluatedBy || "",
          evaluatorName: apiData.evaluatorName || "",
          createdAt: apiData.createdAt || apiData.evaluatedAt || null,
          evaluatedAt: apiData.evaluatedAt || null,
          updatedAt: apiData.updatedAt || apiData.evaluatedAt || null,
          status: apiData.status === "A" ? "ACTIVE" : apiData.status === "I" ? "INACTIVE" : (apiData.status || EVALUATION_STATUS.ACTIVE),
     };
}
