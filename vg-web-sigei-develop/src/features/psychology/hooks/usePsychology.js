import { useState, useCallback } from "react";
import { psychologyService } from "../services/psychologyService";
import { parseEvaluationFromApi } from "../models/psychologyModel";
import Swal from "sweetalert2";

// Nombres que indican que el evaluador no fue resuelto correctamente
const INVALID_EVALUATOR_NAMES = ["evaluator not found", "sin evaluador", ""];

function isValidEvaluatorName(name) {
     if (!name) return false;
     return !INVALID_EVALUATOR_NAMES.includes(name.toLowerCase().trim());
}

const alertSuccess = (message, title = "¡Éxito!") => {
     return Swal.fire({
          icon: "success",
          title,
          text: message,
          confirmButtonColor: "#3b82f6",
     });
};

const alertConfirm = (message, title = "¿Estás seguro?") => {
     return Swal.fire({
          icon: "warning",
          title,
          text: message,
          showCancelButton: true,
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Sí, continuar",
          cancelButtonText: "Cancelar",
     });
};

const alertError = (message, title = "Error") => {
     return Swal.fire({
          icon: "error",
          title,
          text: message,
          confirmButtonColor: "#3b82f6",
     });
};

export function usePsychology(currentUser = null) {
     const [evaluations, setEvaluations] = useState([]);
     const [students, setStudents] = useState([]);
     const [institutions, setInstitutions] = useState([]);
     const [classrooms, setClassrooms] = useState([]);
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          try {
               const [evalResponse, studentsResponse, institutionsResponse, classroomsResponse, usersResponse] = await Promise.all([
                    psychologyService.getAll(),
                    psychologyService.getAllStudents().catch(() => ({ data: [] })),
                    psychologyService.getAllInstitutions().catch(() => ({ data: [] })),
                    psychologyService.getAllClassrooms().catch(() => ({ data: [] })),
                    psychologyService.getAllUsers().catch(() => ({ data: [] })),
               ]);

               setStudents(studentsResponse.data || []);
               setInstitutions(institutionsResponse.data || []);
               setClassrooms(classroomsResponse.data || []);

               const users = usersResponse.data || [];
               setUsers(users);

               if (evalResponse && evalResponse.success && Array.isArray(evalResponse.data)) {
                    // Filtrar evaluaciones por institución del usuario si tiene una asignada
                    let filteredEvaluations = evalResponse.data;
                    if (currentUser?.institutionId) {
                         filteredEvaluations = evalResponse.data.filter(
                              evaluation => String(evaluation.institutionId) === String(currentUser.institutionId)
                         );
                    }

                    const parsedList = filteredEvaluations.map(evaluation => {
                         const parsed = parseEvaluationFromApi(evaluation);
                         const student = (studentsResponse.data || []).find(s => String(s.id) === String(evaluation.studentId));
                         const classroom = (classroomsResponse.data || []).find(c => String(c.id) === String(evaluation.classroomId));
                         const institution = (institutionsResponse.data || []).find(i => String(i.id) === String(evaluation.institutionId));

                         // Resolver nombre del evaluador: usar el guardado o buscar por evaluatedBy
                         let evaluatorName = evaluation.evaluatorName;
                         if (!isValidEvaluatorName(evaluatorName) && evaluation.evaluatedBy) {
                              const evaluator = users.find(u => String(u.id) === String(evaluation.evaluatedBy));
                              if (evaluator) {
                                   evaluatorName = `${evaluator.firstName || ""} ${evaluator.lastName || ""}`.trim();
                              }
                         }

                         return {
                              ...parsed,
                              studentName: student ? `${student.firstName} ${student.lastName}` : "Student not found",
                              classroomName: classroom ? classroom.classroomName : "Classroom not found",
                              institutionName: institution ? institution.name : "Institution not found",
                              evaluatorName: isValidEvaluatorName(evaluatorName) ? evaluatorName : "Sin evaluador",
                              createdAt: evaluation.createdAt,
                         };
                    });

                    // Calcular número de sesión por estudiante
                    const evaluationsByStudent = {};
                    parsedList.forEach(evaluation => {
                         if (!evaluationsByStudent[evaluation.studentId]) {
                              evaluationsByStudent[evaluation.studentId] = [];
                         }
                         evaluationsByStudent[evaluation.studentId].push(evaluation);
                    });
                    Object.keys(evaluationsByStudent).forEach(studentId => {
                         evaluationsByStudent[studentId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                         evaluationsByStudent[studentId].forEach((evaluation, index) => {
                              evaluation.sessionNumber = index + 1;
                         });
                    });

                    setEvaluations(parsedList);
               } else {
                    setEvaluations([]);
               }
          } catch (err) {
               console.error("Error:", err);
               setEvaluations([]);
               Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las evaluaciones" });
          } finally {
               setLoading(false);
          }
     }, [currentUser]);

     const fetchStudents = useCallback(async () => {
          try {
               const response = await psychologyService.getAllStudents();
               setStudents(response.data || []);
          } catch (err) {
               console.error("Error fetching students:", err);
          }
     }, []);

     const fetchInstitutions = useCallback(async () => {
          try {
               const response = await psychologyService.getAllInstitutions();
               setInstitutions(response.data || []);
          } catch (err) {
               console.error("Error fetching institutions:", err);
          }
     }, []);

     const fetchClassrooms = useCallback(async () => {
          try {
               const response = await psychologyService.getAllClassrooms();
               setClassrooms(response.data || []);
          } catch (err) {
               console.error("Error fetching classrooms:", err);
          }
     }, []);

     const fetchUsers = useCallback(async () => {
          try {
               const response = await psychologyService.getAllUsers();
               setUsers(response.data || []);
          } catch (err) {
               console.error("Error fetching users:", err);
          }
     }, []);

     const fetchClassroomsByInstitution = useCallback(async (institutionId) => {          try {
               const response = await psychologyService.getClassroomsByInstitution(institutionId);
               setClassrooms(response.data || []);
          } catch (err) {
               console.error("Error fetching classrooms:", err);
          }
     }, []);

     const fetchById = useCallback(async (id) => {
          setLoading(true);
          try {
               const response = await psychologyService.getById(id);
               if (response && response.success && response.data) {
                    const parsed = parseEvaluationFromApi(response.data);
                    const [studentsRes, classroomsRes, institutionsRes] = await Promise.all([
                         psychologyService.getAllStudents().catch(() => ({ data: [] })),
                         psychologyService.getAllClassrooms().catch(() => ({ data: [] })),
                         psychologyService.getAllInstitutions().catch(() => ({ data: [] })),
                    ]);
                    const student = (studentsRes.data || []).find(s => String(s.id) === String(response.data.studentId));
                    const classroom = (classroomsRes.data || []).find(c => String(c.id) === String(response.data.classroomId));
                    const institution = (institutionsRes.data || []).find(i => String(i.id) === String(response.data.institutionId));
                    return {
                         ...parsed,
                         studentName: student ? `${student.firstName} ${student.lastName}` : "Student not found",
                         classroomName: classroom ? classroom.classroomName : "Classroom not found",
                         institutionName: institution ? institution.name : "Institution not found",
                         evaluatorName: response.data.evaluatorName || "Evaluator not found",
                         createdAt: response.data.createdAt || response.data.evaluatedAt || null,
                         updatedAt: response.data.updatedAt || response.data.evaluatedAt || null,
                    };
               }
               return null;
          } catch (err) {
               console.error("Error fetching evaluation:", err);
               Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la evaluación" });
               return null;
          } finally {
               setLoading(false);
          }
     }, []);

     const createEvaluation = useCallback(async (payload) => {
          const response = await psychologyService.create(payload);
          alertSuccess("Evaluación psicológica creada exitosamente", "¡Creado!");
          return response;
     }, []);

     const updateEvaluation = useCallback(async (id, payload) => {
          const response = await psychologyService.update(id, payload);
          alertSuccess("Evaluación psicológica actualizada exitosamente", "¡Actualizado!");
          return response;
     }, []);

     const deleteEvaluation = useCallback(async (id) => {
          const confirm = await alertConfirm("La evaluación pasará a estado inactivo", "¿Desactivar evaluación psicológica?");
          if (!confirm.isConfirmed) return null;
          await psychologyService.delete(id);
          alertSuccess("Evaluación psicológica desactivada exitosamente", "¡Desactivado!");
     }, []);

     const hardDeleteEvaluation = useCallback(async (id) => {
          const confirm = await alertConfirm("Esta acción es irreversible, se eliminará permanentemente", "¿Eliminar evaluación permanentemente?");
          if (!confirm.isConfirmed) return null;
          await psychologyService.hardDelete(id);
          alertSuccess("Evaluación psicológica eliminada permanentemente", "¡Eliminado!");
     }, []);

     const restoreEvaluation = useCallback(async (id) => {
          const confirm = await alertConfirm("La evaluación volverá a estado activo", "¿Reactivar evaluación psicológica?");
          if (!confirm.isConfirmed) return null;
          try {
               await psychologyService.restore(id);
               alertSuccess("Evaluación psicológica restaurada exitosamente", "¡Restaurado!");
          } catch (error) {
               console.error("Error al restaurar evaluación:", error);
               alertError("No se pudo reactivar la evaluación. Intenta nuevamente.", "Error");
          }
     }, []);

     return {
          evaluations,
          students,
          institutions,
          classrooms,
          users,
          loading,
          fetchAll,
          fetchById,
          fetchStudents,
          fetchInstitutions,
          fetchClassrooms,
          fetchClassroomsByInstitution,
          fetchUsers,
          createEvaluation,
          updateEvaluation,
          deleteEvaluation,
          hardDeleteEvaluation,
          restoreEvaluation,
     };
}
