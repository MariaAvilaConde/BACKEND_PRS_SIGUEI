import { useState, useEffect } from "react";
import { GraduationCap, Plus, RefreshCw, ArrowLeft, UserPlus, FileDown } from "lucide-react";
import { Button, Card, Modal } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { LoadingScreen, alertConfirmUpdate } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { useStudents } from "../../hooks/useStudents";
import { useGuardians } from "../../hooks/useGuardians";
import StudentTable from "../shared/StudentTable";
import StudentForm from "../shared/StudentForm";
import GuardianTable from "../shared/GuardianTable";
import StudentModal from "./StudentModal";
import GuardianModal from "./GuardianModal";
import { parseStudentFromApi } from "../../models/studentModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { classroomService } from "../../services/classroomService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { parseInstitutionFromApi } from "@/features/institutions/models/institutionModel";
import { generateStudentsListReport, generateStudentDetailReport } from "../../services/studentReportService";
import { userService } from "@/features/users/services/userService";

function getClassroomLabel(classroom) {
     const name = classroom?.classroomName || classroom?.name || "Aula";
     const age = classroom?.classroomAge || classroom?.age || "";
     return age ? `${name} (${age})` : name;
}

export default function SecretariaStudentsPage() {
     const { user } = useAuth();
     const institutionId = user?.institutionId;

     const {
          students,
          loading,
          fetchByInstitution,
          fetchAll,
          createStudent,
          updateStudent,
          restoreStudent,
     } = useStudents();

     const {
          guardians,
          loading: guardiansLoading,
          fetchByStudent,
          createGuardian,
          updateGuardian,
          deleteGuardian,
     } = useGuardians();

     const [search, setSearch] = useState("");
     const [studentModalOpen, setStudentModalOpen] = useState(false);
     const [selectedStudent, setSelectedStudent] = useState(null);
     const [detailStudent, setDetailStudent] = useState(null);
     const [guardianModalOpen, setGuardianModalOpen] = useState(false);
     const [selectedGuardian, setSelectedGuardian] = useState(null);
     const [detailClassroomOptions, setDetailClassroomOptions] = useState([]);
     const [loadingDetailClassrooms, setLoadingDetailClassrooms] = useState(false);
     const [institution, setInstitution] = useState({});
     const [classroomMap, setClassroomMap] = useState({});

     useEffect(() => {
          if (institutionId) {
               fetchByInstitution(institutionId);
          } else {
               fetchAll();
          }
     }, [institutionId, fetchByInstitution, fetchAll]);

     useEffect(() => {
          if (!institutionId) return;
          institutionService.getById(institutionId).then((response) => {
               const raw = isSuccessResponse(response) ? extractData(response) : response;
               setInstitution(parseInstitutionFromApi(raw || {}));
          }).catch(() => { });
     }, [institutionId]);

     useEffect(() => {
          if (!institutionId) return;
          classroomService.getByInstitution(institutionId).then((response) => {
               const payload = isSuccessResponse(response) ? extractData(response) : response;
               const list = Array.isArray(payload) ? payload : [];
               const map = {};
               list.forEach((c) => {
                    const name = c.classroomName || c.name || "Aula";
                    const age = c.classroomAge || c.age || "";
                    map[c.id] = age ? `${name} (${age})` : name;
               });
               setClassroomMap(map);
          }).catch(() => { });
     }, [institutionId]);

     useEffect(() => {
          if (detailStudent?.id) {
               fetchByStudent(detailStudent.id);
          }
     }, [detailStudent, fetchByStudent]);

     useEffect(() => {
          if (!detailStudent?.institutionId) {
               setDetailClassroomOptions([]);
               return;
          }

          let cancelled = false;

          const fetchDetailClassrooms = async () => {
               setLoadingDetailClassrooms(true);
               try {
                    const response = await classroomService.getByInstitution(detailStudent.institutionId);
                    const payload = isSuccessResponse(response) ? extractData(response) : response;
                    const classrooms = Array.isArray(payload) ? payload : [];
                    const options = classrooms
                         .filter((classroom) => !classroom?.status || classroom.status === "ACTIVE" || classroom.status === "A")
                         .map((classroom) => ({
                              value: classroom.id,
                              label: getClassroomLabel(classroom),
                         }))
                         .sort((a, b) => a.label.localeCompare(b.label));

                    if (!cancelled) {
                         setDetailClassroomOptions(options);
                    }
               } catch {
                    if (!cancelled) {
                         setDetailClassroomOptions([]);
                    }
               } finally {
                    if (!cancelled) {
                         setLoadingDetailClassrooms(false);
                    }
               }
          };

          fetchDetailClassrooms();

          return () => {
               cancelled = true;
          };
     }, [detailStudent?.institutionId]);

     const filteredStudents = students.filter((s) => {
          if (!search) return true;
          const term = search.toLowerCase();
          const fullName = `${s.firstName} ${s.lastName} ${s.motherLastName}`.toLowerCase();
          return (
               fullName.includes(term) ||
               s.cui?.toLowerCase().includes(term) ||
               s.documentNumber?.toLowerCase().includes(term)
          );
     });

     function handleCreate() {
          setSelectedStudent(null);
          setStudentModalOpen(true);
     }

     function handleEdit(student) {
          setSelectedStudent(student);
          setStudentModalOpen(true);
     }

     function handleView(student) {
          setDetailStudent(parseStudentFromApi(student));
     }

     async function handleSaveStudent(id, data, guardiansPayload) {
          if (id) {
               const confirm = await alertConfirmUpdate("estudiante");
               if (!confirm.isConfirmed) return;
               await updateStudent(id, data);
          } else {
               const response = await createStudent(data);
               if (guardiansPayload?.length && response) {
                    try {
                         const studentData = isSuccessResponse(response) ? extractData(response) : response;
                         const studentId = studentData?.id || studentData;
                         if (studentId) {
                              await Promise.all(
                                   guardiansPayload.map((gPayload) =>
                                        createGuardian({ ...gPayload, studentId })
                                   )
                              );
                         }
                    } catch (error) {
                         console.error("Error al crear apoderados:", error);
                    }
               }
          }
          refreshList();
     }

     async function handleRestore(student) {
          const result = await restoreStudent(student.id);
          if (result) refreshList();
     }

     function refreshList() {
          if (institutionId) {
               fetchByInstitution(institutionId);
          } else {
               fetchAll();
          }
     }

     function handleCreateGuardian() {
          setSelectedGuardian(null);
          setGuardianModalOpen(true);
     }

     function handleEditGuardian(guardian) {
          setSelectedGuardian(guardian);
          setGuardianModalOpen(true);
     }

     async function handleSaveGuardian(id, data) {
          try {
               let guardianResult;
               if (id) {
                    await updateGuardian(id, data);
               } else {
                    guardianResult = await createGuardian(data);

                    if (guardianResult && detailStudent?.id) {
                         const userPayload = {
                              institutionId: detailStudent.institutionId,
                              firstName: data.firstName,
                              lastName: data.lastName,
                              motherLastName: data.motherLastName || data.lastName,
                              documentType: data.documentType,
                              documentNumber: data.documentNumber,
                              phone: data.phone,
                              email: data.email || "",
                              role: mapRelationshipToUserRole(data.relationship),
                         };

                         try {
                              await userService.create(userPayload);
                              console.log("Usuario creado exitosamente para el apoderado");
                         } catch (userError) {
                              console.error("Error creando usuario para apoderado:", userError);
                              console.log("El apoderado se guardó en la BD pero el usuario NO fue creado");
                         }
                    }
               }
               setGuardianModalOpen(false);
               if (detailStudent?.id) {
                    fetchByStudent(detailStudent.id);
               }
          } catch (error) {
               console.error("Error guardando apoderado:", error);
          }
     }

     function mapRelationshipToUserRole(relationship) {
          if (!relationship) return "APODERADO";
          return relationship.toUpperCase();
     }

     async function handleDeleteGuardian(guardian) {
          const result = await deleteGuardian(guardian.id);
          if (result && detailStudent?.id) {
               fetchByStudent(detailStudent.id);
          }
     }

     if (loading && students.length === 0) {
          return <LoadingScreen />;
     }

     if (detailStudent) {
          return (
               <div className="space-y-6">
                    <div className="flex items-center gap-3">
                         <button
                              onClick={() => setDetailStudent(null)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                         >
                              <ArrowLeft className="w-5 h-5" />
                         </button>
                         <div className="flex-1">
                              <h1 className="text-xl font-bold text-gray-900">
                                   {`${detailStudent.firstName} ${detailStudent.lastName} ${detailStudent.motherLastName}`.trim()}
                              </h1>
                              <p className="text-sm text-gray-500">Detalle del estudiante</p>
                         </div>
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={RefreshCw}
                              onClick={() => fetchByStudent(detailStudent.id)}
                              loading={guardiansLoading}
                         >
                              Actualizar
                         </Button>
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={FileDown}
                              onClick={() => generateStudentDetailReport({ ...detailStudent, guardians, classroomName: classroomMap[detailStudent.classroomId] || "" }, institution)}
                         >
                              Exportar Ficha
                         </Button>
                    </div>

                    <Card padding="p-6">
                         <StudentForm
                              student={detailStudent}
                              readOnly
                              classroomOptions={detailClassroomOptions}
                              loadingClassrooms={loadingDetailClassrooms}
                         />
                    </Card>

                    <div className="space-y-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <h2 className="text-lg font-semibold text-gray-900">Apoderados</h2>
                                   <p className="text-sm text-gray-500">Padres, madres y tutores del estudiante</p>
                              </div>
                              <Button
                                   variant="primary"
                                   size="sm"
                                   icon={UserPlus}
                                   onClick={handleCreateGuardian}
                              >
                                   Agregar Apoderado
                              </Button>
                         </div>

                         <Card padding="p-0">
                              <GuardianTable
                                   guardians={guardians}
                                   onEdit={handleEditGuardian}
                                   onDelete={handleDeleteGuardian}
                              />
                         </Card>
                    </div>

                    <GuardianModal
                         isOpen={guardianModalOpen}
                         onClose={() => setGuardianModalOpen(false)}
                         guardian={selectedGuardian}
                         studentId={detailStudent.id}
                         onSave={handleSaveGuardian}
                    />
               </div>
          );
     }

     return (
          <div className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-primary-100 rounded-xl">
                              <GraduationCap className="w-6 h-6 text-primary-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Estudiantes</h1>
                              <p className="text-sm text-gray-500">
                                   Gestión de estudiantes y apoderados
                              </p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={RefreshCw}
                              onClick={refreshList}
                              loading={loading}
                         >
                              Actualizar
                         </Button>
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={FileDown}
                              onClick={() => generateStudentsListReport(filteredStudents.map((s) => ({ ...s, classroomName: classroomMap[s.classroomId] || "" })), institution)}
                         >
                              Exportar
                         </Button>
                         <Button
                              variant="primary"
                              icon={Plus}
                              onClick={handleCreate}
                         >
                              Nuevo Estudiante
                         </Button>
                    </div>
               </div>

               <Card padding="p-4">
                    <SearchInput
                         value={search}
                         onChange={setSearch}
                         placeholder="Buscar por nombre, CUI o documento..."
                    />
               </Card>

               <StudentTable
                    students={filteredStudents}
                    onView={handleView}
                    onEdit={handleEdit}
                    onRestore={handleRestore}
               />

               <StudentModal
                    isOpen={studentModalOpen}
                    onClose={() => setStudentModalOpen(false)}
                    student={selectedStudent}
                    institutionId={institutionId}
                    onSave={handleSaveStudent}
               />
          </div>
     );
}
