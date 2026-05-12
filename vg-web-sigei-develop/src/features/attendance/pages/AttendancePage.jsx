import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Sparkles, AlertTriangle, School } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { calendarService } from "@/features/events/services/calendarService";
import Swal from "sweetalert2";

function Button({ variant = "primary", size = "md", icon: Icon, onClick, loading, disabled = false, children, className = "" }) {
     const variants = {
          primary: "bg-primary-600 hover:bg-primary-700 text-white",
          ghost: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
     };
     const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };

     return (
          <button
               onClick={onClick}
               disabled={loading || disabled}
               className={`rounded-lg font-medium transition-colors flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
          >
               {Icon && <Icon className="w-4 h-4" />}
               {loading ? "Cargando..." : children}
          </button>
     );
}

function Card({ children, padding = "p-4" }) {
     return <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${padding}`}>{children}</div>;
}

export default function AttendancePage() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const {
          classrooms,
          loading,
          fetchAll,
          fetchClassroomsByInstitution,
     } = useAttendance(user);
     const [todayCelebrations, setTodayCelebrations] = useState([]);
     const [attendanceBlockedReason, setAttendanceBlockedReason] = useState("");

     useEffect(() => {
          fetchAll();
          // Cargar aulas según la institución del usuario
          if (user?.institutionId) {
               fetchClassroomsByInstitution(user.institutionId);
          }
     }, [fetchAll, fetchClassroomsByInstitution, user?.institutionId]);

     useEffect(() => {
          const loadTodayCalendarContext = async () => {
               try {
                    const nowPeru = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
                    const todayStr = nowPeru.toISOString().split("T")[0];
                    setAttendanceBlockedReason("");

                    if (!user?.institutionId) {
                         setTodayCelebrations([]);
                         return;
                    }

                    const calendars = await calendarService.getByInstitution(user.institutionId);
                    const activeCalendar = (calendars || []).find((calendar) => {
                         if (calendar.status !== "ACTIVE") return false;
                         const start = String(calendar.startDate || "").slice(0, 10);
                         const end = String(calendar.endDate || "").slice(0, 10);
                         return start && end && todayStr >= start && todayStr <= end;
                    });

                    if (!activeCalendar?.id) {
                         setTodayCelebrations([]);
                         return;
                    }

                    const calendarWithEvents = await calendarService.getWithEvents(activeCalendar.id);
                    const todayEvents = (calendarWithEvents?.events || []).filter((event) => {
                         if (event.status && event.status !== "ACTIVE") return false;
                         const start = String(event.startDate || "").slice(0, 10);
                         const end = String(event.endDate || event.startDate || "").slice(0, 10);
                         if (!start) return false;
                         return todayStr >= start && todayStr <= end;
                    });

                    setTodayCelebrations(todayEvents);

                    const holidayEvent = todayEvents.find((event) => event.isHoliday === true);
                    if (holidayEvent) {
                         setAttendanceBlockedReason(`Hoy es feriado: "${holidayEvent.title}". No se permite registrar asistencia.`);
                    }
               } catch (error) {
                    console.error("Error loading calendar context for attendance:", error);
                    setTodayCelebrations([]);
               }
          };

          loadTodayCalendarContext();
     }, [user?.institutionId]);

     const isAttendanceBlocked = Boolean(attendanceBlockedReason);

     const handleOpenClassroom = (classroomId) => {
          navigate(`/auxiliar/asistencia/aula/${classroomId}`);
     };

     if (loading && classrooms.length === 0) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
               </div>
          );
     }

     return (
          <div className="space-y-5 p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
               {/* Header */}
               <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                         <div className="hidden sm:flex p-2.5 rounded-xl bg-primary-100">
                              <Sparkles className="w-5 h-5 text-primary-700" />
                         </div>
                         <div>
                              <h1 className="text-2xl font-bold text-gray-900">Asistencia del día</h1>
                              <p className="text-sm text-gray-600 mt-0.5">Inicia el día y marca presentes por aula</p>
                              {todayCelebrations.length > 0 && (
                                   <p className="text-sm text-indigo-700 mt-1.5 font-medium">
                                        Hoy se celebra: {todayCelebrations.map((event) => event.title).join(" | ")}
                                   </p>
                              )}
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button
                              onClick={fetchAll}
                              disabled={loading}
                              className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                              title="Actualizar"
                         >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                         </button>
                    </div>
               </div>

               {isAttendanceBlocked && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                         <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5" />
                         <div>
                              <p className="text-sm font-semibold text-amber-800">Registro de asistencia bloqueado</p>
                              <p className="text-sm text-amber-700 mt-0.5">{attendanceBlockedReason}</p>
                         </div>
                    </div>
               )}

               <Card padding="p-0">
                    <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                         <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aulas de la institución</p>
                              <p className="text-sm text-gray-700 mt-0.5">Selecciona un aula para ver todas las fechas y registrar el día.</p>
                         </div>
                         <div className="text-xs text-gray-500">Selecciona un aula para abrir la hoja</div>
                    </div>
                    <div className="p-5">
                         {classrooms.length === 0 ? (
                              <div className="text-center py-10 text-gray-600">
                                   <School className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                   <p className="font-semibold">No hay aulas disponibles</p>
                                   <p className="text-sm mt-1">Verifica que tu institución tenga aulas activas.</p>
                              </div>
                         ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                   {classrooms.map((c) => (
                                        <button
                                             key={c.id}
                                             onClick={() => handleOpenClassroom(c.id)}
                                             className="text-left bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-primary-300 hover:shadow-sm transition-all"
                                        >
                                             <div className="flex items-start justify-between gap-2">
                                                  <div>
                                                       <p className="text-sm font-semibold text-gray-900">{c.classroomName}</p>
                                                       <p className="text-xs text-gray-500 mt-0.5">Abrir hoja del día</p>
                                                  </div>
                                                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                                                       <School className="w-4 h-4 text-gray-700" />
                                                  </div>
                                             </div>
                                        </button>
                                   ))}
                              </div>
                         )}
                    </div>
               </Card>
          </div>
     );
}
