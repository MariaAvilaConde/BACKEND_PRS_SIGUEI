import { useState, useEffect } from "react";
import { X, QrCode, Save, Trash2, Clock, Users, School, CheckCircle2 } from "lucide-react";
import QRScannerModal from "./QRScannerModal";
import Swal from "sweetalert2";

export default function BulkQRScanner({ open, onClose, students, classrooms, onSave, currentUser }) {
     const [scannedStudents, setScannedStudents] = useState([]);
     const [showScanner, setShowScanner] = useState(false);
     const [error, setError] = useState(null);
     const [saving, setSaving] = useState(false);

     // Filtrar aulas por la institución del usuario
     const userClassrooms = classrooms.filter(c => 
          currentUser?.institutionId ? c.institutionId === currentUser.institutionId : true
     );
     const classroomSummary = scannedStudents.reduce((acc, student) => {
          const classroom = student.classroomName || "Sin aula";
          acc[classroom] = (acc[classroom] || 0) + 1;
          return acc;
     }, {});

     useEffect(() => {
          if (!open) {
               setScannedStudents([]);
               setError(null);
          }
     }, [open]);

     const handleQRScan = async (data) => {
          let studentId;
          let student;

          // Si viene DNI, buscar estudiante por DNI
          if (data.dni) {
               student = students.find(s => s.documentNumber === data.dni);
               if (!student) {
                    setError(`No se encontró ningún estudiante con DNI: ${data.dni}`);
                    setTimeout(() => setError(null), 3000);
                    return;
               }
               studentId = student.id.toString();
          } else {
               // Si viene studentId del QR
               studentId = data.studentId;
               student = students.find(s => s.id.toString() === studentId);
          }
          
          // Verificar si ya fue escaneado
          if (scannedStudents.find(s => s.studentId === studentId)) {
               setError("Este estudiante ya fue escaneado");
               setTimeout(() => setError(null), 3000);
               return;
          }

          // Buscar datos del estudiante
          if (!student) {
               setError("Estudiante no encontrado");
               setTimeout(() => setError(null), 3000);
               return;
          }

          if (!student.classroomId) {
               setError(`El estudiante ${student.firstName} ${student.lastName} no tiene aula asignada.`);
               setTimeout(() => setError(null), 4000);
               return;
          }

          // Agregar a la lista con hora actual
          const now = new Date();
          const entryTime = now.toLocaleTimeString('es-PE', { 
               hour: '2-digit', 
               minute: '2-digit',
               second: '2-digit',
               hour12: false 
          });

          setScannedStudents(prev => [...prev, {
               studentId: student.id,
               studentName: `${student.firstName} ${student.lastName}`,
               classroomId: student.classroomId,
               classroomName: classrooms.find(c => String(c.id) === String(student.classroomId))?.classroomName || "Aula no encontrada",
               cui: student.cui,
               entryTime,
               scannedAt: now
          }]);

          setError(null);
     };

     const handleRemoveStudent = (studentId) => {
          setScannedStudents(prev => prev.filter(s => s.studentId !== studentId));
     };

     const handleSaveAll = async () => {
          if (scannedStudents.length === 0) {
               setError("No hay estudiantes escaneados");
               return;
          }

          setSaving(true);

          try {
               // Preparar registros de asistencia
               const attendanceRecords = scannedStudents.map(student => ({
                    studentId: student.studentId,
                    classroomId: student.classroomId,
                    institutionId: currentUser.institutionId,
                    attendanceDate: new Date().toISOString().split('T')[0],
                    academicYear: new Date().getFullYear(),
                    status: "PRESENT",
                    arrivalTime: student.entryTime,
                    registeredBy: currentUser.userId || currentUser.id
               }));

               await onSave(attendanceRecords);
               onClose();
          } catch (error) {
               console.error("Error al guardar:", error);
               
               // Manejar error 409 (Conflict - registro duplicado)
               if (error.response?.status === 409) {
                    Swal.fire({
                         title: "Registro duplicado",
                         text: "Uno o más estudiantes ya tienen registro de asistencia para hoy",
                         icon: "warning",
                         confirmButtonText: "Entendido",
                         confirmButtonColor: "#3b82f6",
                         customClass: {
                              popup: 'rounded-lg',
                              title: 'text-lg font-semibold',
                              confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
                         }
                    });
               }
          } finally {
               setSaving(false);
          }
     };

     if (!open) return null;

     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black/55" onClick={onClose}></div>
                    <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
                         <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                   <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                                        <QrCode className="w-4 h-4 text-slate-700" />
                                   </div>
                                   <div>
                                        <h2 className="text-base font-semibold text-slate-900">Registro Masivo de Asistencia</h2>
                                        <p className="text-xs text-slate-500">Escanea y registra estudiantes por lote</p>
                                   </div>
                              </div>
                              <button onClick={onClose} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md p-1.5 transition-colors">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>

                         <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                              {error && (
                                   <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                        <p className="text-sm font-medium text-red-800">{error}</p>
                                   </div>
                              )}

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                   <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                             <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                                                  <School className="w-4 h-4 text-slate-700" />
                                             </div>
                                             <div>
                                                  <p className="text-sm font-semibold text-slate-900">Asignación automática por aula</p>
                                                  <p className="text-sm text-slate-600 mt-0.5">
                                                       El sistema asigna cada estudiante a su aula correspondiente al guardar.
                                                  </p>
                                             </div>
                                        </div>
                                        {userClassrooms.length === 0 && (
                                             <p className="mt-2 text-sm text-red-600">No hay aulas disponibles para tu institución.</p>
                                        )}
                                   </div>

                                   <div className="bg-white border border-slate-200 rounded-lg p-4">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Acción</p>
                                        <button
                                             onClick={() => setShowScanner(true)}
                                             className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                                        >
                                             <QrCode className="w-4 h-4" />
                                             Escanear Estudiante
                                        </button>
                                        <p className="text-xs text-slate-500 mt-2">Puedes escanear múltiples estudiantes antes de guardar.</p>
                                   </div>
                              </div>

                              {scannedStudents.length === 0 ? (
                                   <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white">
                                        <QrCode className="w-14 h-14 mx-auto mb-3 opacity-40" />
                                        <p className="text-base font-semibold text-slate-700">Aún no hay estudiantes escaneados</p>
                                        <p className="text-sm mt-1">Escanea estudiantes para construir el lote de registro.</p>
                                   </div>
                              ) : (
                                   <div className="space-y-4">
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                             <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                       <Users className="w-4 h-4 text-slate-600" />
                                                       <h3 className="font-semibold text-slate-900 text-sm">
                                                            Estudiantes Escaneados ({scannedStudents.length})
                                                       </h3>
                                                  </div>
                                             </div>
                                             <div className="divide-y max-h-80 overflow-y-auto">
                                                  {scannedStudents.map((student, index) => (
                                                       <div key={student.studentId} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                 <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                                                      {index + 1}
                                                                 </div>
                                                                 <div>
                                                                      <p className="font-semibold text-slate-900 leading-5">{student.studentName}</p>
                                                                      <p className="text-sm text-slate-500">CUI: {student.cui || "N/A"}</p>
                                                                      <p className="text-xs text-slate-700 font-medium mt-0.5">Aula: {student.classroomName}</p>
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                 <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                                                                      <Clock className="w-4 h-4" />
                                                                      <span className="font-medium">{student.entryTime}</span>
                                                                 </div>
                                                                 <button
                                                                      onClick={() => handleRemoveStudent(student.studentId)}
                                                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                      title="Eliminar"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>

                                        <div className="border border-slate-200 rounded-lg p-4 bg-white">
                                             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Distribución por aula</p>
                                             <div className="flex flex-wrap gap-2">
                                                  {Object.entries(classroomSummary).map(([classroom, total]) => (
                                                       <span key={classroom} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                                            {classroom}: {total}
                                                       </span>
                                                  ))}
                                             </div>
                                   </div>
                                   </div>
                              )}
                         </div>

                         {/* Footer */}
                         <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center gap-3">
                              <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                   <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                   Listos para guardar: {scannedStudents.length}
                              </div>
                              <div className="flex items-center gap-3">
                              <button
                                   onClick={onClose}
                                   disabled={saving}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   Cancelar
                              </button>
                                   <button
                                        onClick={handleSaveAll}
                                        disabled={scannedStudents.length === 0 || saving}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                   >
                                        {saving ? (
                                             <>
                                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                  Guardando...
                                             </>
                                        ) : (
                                             <>
                                                  <Save className="w-4 h-4" />
                                                  Guardar Todos ({scannedStudents.length})
                                             </>
                                        )}
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>

               {/* QR Scanner Modal */}
               <QRScannerModal
                    open={showScanner}
                    onClose={() => setShowScanner(false)}
                    onScan={handleQRScan}
               />
          </div>
     );
}
