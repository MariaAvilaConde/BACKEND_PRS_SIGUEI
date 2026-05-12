import { useState, useCallback } from "react";
import { enrollmentService } from "../services/enrollmentService";
import { studentService } from "../../students/services/studentService";
import {
  alertApiError,
  alertCreated,
  alertUpdated,
  alertConfirmDelete,
  alertDeleted,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await enrollmentService.getAll();
      const data = isSuccessResponse(response) ? extractData(response) : response;
      setEnrollments(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err);
      alertApiError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar recreación

  const fetchByStudent = useCallback(async (studentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await enrollmentService.getByStudent(studentId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      alertApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByAcademicPeriod = useCallback(async (periodId) => {
    setLoading(true);
    setError(null);
    try {
      // Nota: El endpoint BY_PERIOD no existe en el backend actual
      // Se debe filtrar del lado del cliente o agregar el endpoint al backend
      const response = await enrollmentService.getAll();
      const data = isSuccessResponse(response) ? extractData(response) : response;
      const filtered = Array.isArray(data) 
        ? data.filter(enrollment => enrollment.academicPeriodId === periodId)
        : [];
      setEnrollments(filtered);
    } catch (err) {
      setError(err);
      alertApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByInstitution = useCallback(async (institutionId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await enrollmentService.getByInstitution(institutionId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      alertApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchById = useCallback(async (id) => {
    try {
      const response = await enrollmentService.getById(id);
      return isSuccessResponse(response) ? extractData(response) : response;
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  const createEnrollment = useCallback(async (payload) => {
    console.log("📤 Payload enviado al backend:", payload);
    try {
      const response = await enrollmentService.create(payload);
      
      // Actualizar el aula en el registro del estudiante
      if (payload.studentId && payload.classroomId) {
        try {
          console.log(`🔄 Sincronizando aula del estudiante ${payload.studentId} -> ${payload.classroomId}`);
          await studentService.update(payload.studentId, { 
            classroomId: payload.classroomId,
            institutionId: payload.institutionId 
          });
          console.log("✅ Aula e institución del estudiante actualizadas exitosamente");
        } catch (studentError) {
          console.error("❌ Error al actualizar el aula del estudiante:", studentError);
        }
      } else {
        console.warn("⚠️ No se pudo sincronizar el aula del estudiante: studentId o classroomId ausentes", {
          studentId: payload.studentId,
          classroomId: payload.classroomId
        });
      }

      alertCreated("Matrícula");
      return response;
    } catch (error) {
      console.error("❌ Error al crear matrícula:", error);
      
      // Extraer mensaje de error del backend
      let errorMessage = "Error al crear la matrícula";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mensajes específicos según el tipo de error
      if (errorMessage.includes("Student") || errorMessage.includes("estudiante")) {
        errorMessage = "El estudiante seleccionado no existe o no está activo";
      } else if (errorMessage.includes("Institution") || errorMessage.includes("institución")) {
        errorMessage = "La institución o el aula seleccionada no existe o no está activa";
      } else if (errorMessage.includes("Duplicate") || errorMessage.includes("duplicado")) {
        errorMessage = "El estudiante ya está matriculado en esta institución";
      } else if (errorMessage.includes("Classroom") || errorMessage.includes("aula")) {
        errorMessage = "El aula seleccionada no existe o no pertenece a la institución";
      }
      
      alertApiError(new Error(errorMessage));
      throw error;
    }
  }, []);

  const updateEnrollment = useCallback(async (id, payload) => {
    console.log("📤 Actualizando matrícula ID:", id);
    console.log("📤 Payload de actualización:", payload);
    console.log("📤 classroomId en actualización:", payload.classroomId);
    
    try {
      const response = await enrollmentService.update(id, payload);
      
      // Actualizar el aula en el registro del estudiante si se proporcionó en el payload
      // Usar payload.studentId si está presente, de lo contrario intentar obtenerlo si es necesario
      const studentIdToUpdate = payload.studentId;
      
      if (studentIdToUpdate && payload.classroomId) {
        try {
          console.log(`🔄 Sincronizando aula del estudiante ${studentIdToUpdate} -> ${payload.classroomId}`);
          await studentService.update(studentIdToUpdate, { 
            classroomId: payload.classroomId,
            institutionId: payload.institutionId
          });
          console.log("✅ Aula e institución del estudiante actualizadas exitosamente");
        } catch (studentError) {
          console.error("❌ Error al actualizar el aula del estudiante:", studentError);
        }
      } else if (payload.classroomId) {
        console.warn("⚠️ No se pudo actualizar el aula del estudiante: studentId no presente en el payload de actualización", payload);
      }

      alertUpdated("Matrícula");
      console.log("✅ Matrícula actualizada exitosamente:", response);
      return response;
    } catch (error) {
      console.error("❌ Error al actualizar matrícula:", error);
      
      // Extraer mensaje de error del backend
      let errorMessage = "Error al actualizar la matrícula";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mensajes específicos según el tipo de error
      if (errorMessage.includes("Classroom") || errorMessage.includes("aula")) {
        errorMessage = "El aula seleccionada no existe o no pertenece a la institución";
      } else if (errorMessage.includes("Institution") || errorMessage.includes("institución")) {
        errorMessage = "La institución seleccionada no existe o no está activa";
      } else if (errorMessage.includes("Student") || errorMessage.includes("estudiante")) {
        errorMessage = "El estudiante seleccionado no existe o no está activo";
      }
      
      alertApiError(new Error(errorMessage));
      throw error;
    }
  }, []);

  const deleteEnrollment = useCallback(async (id) => {
    try {
      const confirm = await alertConfirmDelete("matrícula");
      if (!confirm.isConfirmed) return null;
      
      console.log(`🗑️ Intentando eliminar matrícula con ID: ${id}`);
      await enrollmentService.delete(id);
      alertDeleted("Matrícula");
      console.log(`✅ Matrícula ${id} eliminada exitosamente`);
      return true;
    } catch (err) {
      console.error("❌ Error al eliminar matrícula:", {
        id,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      // Manejo específico de errores
      let errorMessage = "Error al eliminar la matrícula";
      if (err.response?.status === 500) {
        errorMessage = "Error interno del servidor. La matrícula podría estar siendo utilizada en otros registros o hay un problema en el servidor.";
      } else if (err.response?.status === 404) {
        errorMessage = "La matrícula no fue encontrada. Podría haber sido eliminada por otro usuario.";
      } else if (err.response?.status === 403) {
        errorMessage = "No tiene permisos para eliminar esta matrícula.";
      } else if (err.response?.status === 409) {
        errorMessage = "No se puede eliminar la matrícula porque está siendo utilizada en otros registros.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alertApiError(new Error(errorMessage));
      return false;
    }
  }, []);

  const restoreEnrollment = useCallback(async (id) => {
    // Nota: El endpoint RESTORE no existe en el backend actual
    // El backend solo soporta soft delete, no restore
    console.warn("Restore functionality not implemented in backend");
    alertApiError(new Error("La funcionalidad de restaurar no está implementada en el backend"));
    return false;
  }, []);

  const activateEnrollment = useCallback(async (id) => {
    try {
      console.log(`🔄 Activando matrícula con ID: ${id}`);
      await enrollmentService.activate(id);
      
      // Mostrar mensaje de éxito personalizado
      alertUpdated("Matrícula activada");
      
      console.log(`✅ Matrícula ${id} activada exitosamente`);
      return true;
    } catch (err) {
      console.error("❌ Error al activar matrícula:", {
        id,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = "Error al activar la matrícula";
      if (err.response?.status === 404) {
        errorMessage = "La matrícula no fue encontrada.";
      } else if (err.response?.status === 400) {
        errorMessage = "La matrícula no se puede activar. Verifique que esté en estado PENDING.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alertApiError(new Error(errorMessage));
      return false;
    }
  }, []);

  const setPendingEnrollment = useCallback(async (id) => {
    try {
      console.log(`🔄 Cambiando matrícula a pendiente con ID: ${id}`);
      await enrollmentService.setPending(id);
      
      // Mostrar mensaje de éxito personalizado
      alertUpdated("Matrícula cambiada a pendiente");
      
      console.log(`✅ Matrícula ${id} cambiada a pendiente exitosamente`);
      return true;
    } catch (err) {
      console.error("❌ Error al cambiar matrícula a pendiente:", {
        id,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = "Error al cambiar la matrícula a pendiente";
      if (err.response?.status === 404) {
        errorMessage = "La matrícula no fue encontrada.";
      } else if (err.response?.status === 400) {
        errorMessage = "La matrícula no se puede cambiar a pendiente. Verifique que esté en estado INACTIVE.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alertApiError(new Error(errorMessage));
      return false;
    }
  }, []);

  return {
    enrollments,
    loading,
    error,
    fetchAll,
    fetchByStudent,
    fetchByAcademicPeriod,
    fetchByInstitution,
    fetchById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    restoreEnrollment,
    activateEnrollment,
    setPendingEnrollment,
  };
}
