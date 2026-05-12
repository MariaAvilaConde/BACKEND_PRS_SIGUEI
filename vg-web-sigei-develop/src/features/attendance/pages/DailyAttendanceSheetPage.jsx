import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, QrCode, RefreshCw, Users, CheckCircle2, AlertTriangle, Play, FileText, Upload, CheckCircle, Download } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "@/core/auth/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { attendanceService } from "../services/attendanceService";
import QRScannerModal from "../components/QRScannerModal";
import ViewDocumentModal from "../components/ViewDocumentModal";
import { exportAttendanceCsv, exportAttendancePdf, exportAttendancePdfAllDays } from "../services/attendanceReportService";

function getPeruNow() {
     return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
}

function getTodayYmd() {
     return getPeruNow().toISOString().split("T")[0];
}

function getNowTimeHm() {
     const now = getPeruNow();
     const hh = String(now.getHours()).padStart(2, "0");
     const mm = String(now.getMinutes()).padStart(2, "0");
     return `${hh}:${mm}`;
}

export default function DailyAttendanceSheetPage() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const { classroomId } = useParams();

     const { students, classrooms, loading, fetchAll, fetchStudentsByClassroom, updateAttendance } = useAttendance(user);

     const [sheetLoading, setSheetLoading] = useState(false);
     const [startingDay, setStartingDay] = useState(false);
     const [scanOpen, setScanOpen] = useState(false);
     const [classroomAttendances, setClassroomAttendances] = useState([]);
     const [cellEditor, setCellEditor] = useState({ open: false, studentId: null, ymd: null, x: 0, y: 0 });
     const [detailModal, setDetailModal] = useState({ open: false, studentId: null, ymd: null });
     const [docModal, setDocModal] = useState({ open: false, url: "", title: "" });

     const todayYmd = useMemo(() => getTodayYmd(), []);

     const currentClassroom = useMemo(
          () => (classrooms || []).find((c) => String(c.id) === String(classroomId)) || null,
          [classrooms, classroomId]
     );

     const refresh = async () => {
          setSheetLoading(true);
          try {
               await fetchAll();
               if (classroomId) {
                    await fetchStudentsByClassroom(classroomId);
               }
               const response = await attendanceService.getByClassroom(classroomId);
               const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
               const filtered = (list || []).filter((a) =>
                    user?.institutionId ? String(a.institutionId) === String(user.institutionId) : true
               );
               setClassroomAttendances(filtered);
          } catch (err) {
               console.error("Error loading daily sheet:", err);
               setClassroomAttendances([]);
               Swal.fire({
                    icon: "error",
                    title: "No se pudo cargar",
                    text: "Intenta nuevamente.",
                    confirmButtonColor: "#2563eb",
               });
          } finally {
               setSheetLoading(false);
          }
     };

     useEffect(() => {
          refresh();
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [classroomId]);

     const dateColumns = useMemo(() => {
          const set = new Set();
          for (const a of classroomAttendances || []) {
               const ymd = String(a.attendanceDate || "").slice(0, 10);
               if (ymd) set.add(ymd);
          }
          // mostrar ordenado ascendente para parecerse a hoja; scroll horizontal
          return Array.from(set).sort((a, b) => a.localeCompare(b));
     }, [classroomAttendances]);

     const attendanceByStudentDate = useMemo(() => {
          const map = new Map(); // key `${studentId}|${ymd}` -> attendance
          for (const a of classroomAttendances || []) {
               const ymd = String(a.attendanceDate || "").slice(0, 10);
               if (!ymd) continue;
               map.set(`${String(a.studentId)}|${ymd}`, a);
          }
          return map;
     }, [classroomAttendances]);

     const rows = useMemo(() => {
          return (students || [])
               .slice()
               .sort((a, b) => {
                    const an = `${a.lastName || ""} ${a.firstName || ""}`.trim().toLowerCase();
                    const bn = `${b.lastName || ""} ${b.firstName || ""}`.trim().toLowerCase();
                    return an.localeCompare(bn);
               })
               .map((s, index) => {
                    const todayAtt = attendanceByStudentDate.get(`${String(s.id)}|${todayYmd}`) || null;
                    return {
                         idx: index + 1,
                         student: s,
                         todayAttendance: todayAtt,
                    };
               });
     }, [students, attendanceByStudentDate, todayYmd]);

     const stats = useMemo(() => {
          const todayRows = rows.map((r) => {
               const a = attendanceByStudentDate.get(`${String(r.student.id)}|${todayYmd}`);
               return a?.status || "ABSENT";
          });
          let present = 0;
          let absent = 0;
          let justified = 0;
          for (const st of todayRows) {
               if (st === "PRESENT") present += 1;
               else if (st === "JUSTIFIED") justified += 1;
               else absent += 1;
          }
          return { present, absent, justified, total: rows.length };
     }, [rows, attendanceByStudentDate, todayYmd]);


     const getCell = (studentId, ymd) => {
          return attendanceByStudentDate.get(`${String(studentId)}|${ymd}`) || null;
     };

     const ensureCellExists = async ({ studentId, ymd }) => {
          const existing = getCell(studentId, ymd);
          if (existing?.id) return existing;
          if (!user?.institutionId) return null;

          try {
               const now = getPeruNow();
               await attendanceService.create({
                    studentId,
                    classroomId,
                    institutionId: user.institutionId,
                    attendanceDate: ymd,
                    academicYear: now.getFullYear(),
                    status: "ABSENT",
                    registeredBy: user?.userId || user?.id,
               });
               await refresh();
               return getCell(studentId, ymd);
          } catch (err) {
               // Si ya existe (conflicto), refrescar y devolver el existente
               if (err?.response?.status === 409) {
                    await refresh();
                    return getCell(studentId, ymd);
               }
               console.error("Error creating missing attendance cell:", err);
               return null;
          }
     };

     const saveCell = async ({ studentId, ymd, patch }) => {
          const cell = await ensureCellExists({ studentId, ymd });
          if (!cell?.id) {
               await Swal.fire({
                    icon: "warning",
                    title: "No se pudo guardar",
                    text: "No se pudo crear/leer el registro. Actualiza la hoja e intenta nuevamente.",
                    confirmButtonColor: "#2563eb",
               });
               return;
          }

          const isClosed = cell.status === "PRESENT" && Boolean(cell.arrivalTime) && Boolean(cell.departureTime);
          if (isClosed) {
               await Swal.fire({
                    icon: "info",
                    title: "Registro cerrado",
                    text: "Este registro ya tiene hora de ingreso y salida. No se puede modificar, solo ver el detalle.",
                    confirmButtonColor: "#2563eb",
               });
               return;
          }

          const next = {
               ...cell,
               status: patch.status ?? cell.status,
               arrivalTime: patch.arrivalTime ?? cell.arrivalTime,
               departureTime: patch.departureTime ?? cell.departureTime,
               justificationReason: patch.justificationReason ?? cell.justificationReason,
               justificationDocumentUrl: patch.justificationDocumentUrl ?? cell.justificationDocumentUrl,
          };

          try {
               await updateAttendance(cell.id, next);
               await refresh();
          } catch (err) {
               console.error("Error updating attendance row:", err);
               Swal.fire({
                    icon: "error",
                    title: "No se pudo guardar",
                    text: "Intenta nuevamente.",
                    confirmButtonColor: "#2563eb",
               });
          }
     };

     const uploadEvidence = async ({ attendanceId, file }) => {
          const { default: apiClient } = await import("@/core/api/apiClient");
          const formDataUpload = new FormData();
          formDataUpload.append("file", file);
          const response = await apiClient.post(`/api/attendance/${attendanceId}/upload-justification`, formDataUpload, {
               headers: { "Content-Type": "multipart/form-data" },
          });
          return response?.data?.url || "";
     };

     const ensureTodayExists = async () => {
          // Si hoy ya está en columnas, ya existe al menos un registro; igual puede faltar para algún estudiante,
          // pero el flujo esperado crea AUSENTE para todos.
          if (dateColumns.includes(todayYmd)) return true;

          await Swal.fire({
               icon: "warning",
               title: "Día no iniciado",
               text: "Primero presiona “Empezar un nuevo día” para crear la columna de hoy.",
               confirmButtonColor: "#2563eb",
          });
          return false;
     };

     const handleScan = async (payload) => {
          if (!(await ensureTodayExists())) return;

          const scannedStudent =
               payload?.studentId
                    ? (students || []).find((s) => String(s.id) === String(payload.studentId))
                    : payload?.dni
                         ? (students || []).find((s) => String(s.documentNumber) === String(payload.dni))
                         : null;

          if (!scannedStudent) {
               Swal.fire({
                    icon: "warning",
                    title: "No encontrado",
                    text: "El estudiante escaneado no está en esta aula.",
                    confirmButtonColor: "#2563eb",
               });
               return;
          }

          const existing = getCell(scannedStudent.id, todayYmd);
          const nowTime = getNowTimeHm();

          // Regla: si ya está PRESENTE con hora de ingreso y sin salida -> registrar SALIDA.
          // Caso contrario -> registrar INGRESO (PRESENTE + arrivalTime).
          const shouldRegisterExit =
               existing?.status === "PRESENT" &&
               Boolean(existing?.arrivalTime) &&
               !String(existing?.departureTime || "").trim();

          if (shouldRegisterExit) {
               await saveCell({
                    studentId: scannedStudent.id,
                    ymd: todayYmd,
                    patch: { status: "PRESENT", departureTime: nowTime },
               });
               return;
          }

          await saveCell({
               studentId: scannedStudent.id,
               ymd: todayYmd,
               patch: { status: "PRESENT", arrivalTime: existing?.arrivalTime || nowTime },
          });
     };

     const handleStartDay = async () => {
          if (!user?.institutionId) {
               await Swal.fire({
                    icon: "warning",
                    title: "Sin institución",
                    text: "Tu usuario no tiene institución asignada.",
                    confirmButtonColor: "#2563eb",
               });
               return;
          }

          const confirm = await Swal.fire({
               icon: "question",
               title: "Empezar un nuevo día",
               text: `Se creará una nueva columna para hoy (${todayYmd}) y se registrará AUSENTE a todos los estudiantes del aula.`,
               showCancelButton: true,
               confirmButtonText: "Empezar",
               cancelButtonText: "Cancelar",
               confirmButtonColor: "#2563eb",
               cancelButtonColor: "#6b7280",
          });

          if (!confirm.isConfirmed) return;

          setStartingDay(true);
          try {
               const now = getPeruNow();
               const payload = (students || []).map((s) => ({
                    studentId: s.id,
                    classroomId,
                    institutionId: user.institutionId,
                    attendanceDate: todayYmd,
                    academicYear: now.getFullYear(),
                    status: "ABSENT",
                    registeredBy: user?.userId || user?.id,
               }));

               if (payload.length === 0) {
                    await Swal.fire({
                         icon: "warning",
                         title: "Sin estudiantes",
                         text: "No hay estudiantes registrados en este aula.",
                         confirmButtonColor: "#2563eb",
                    });
                    return;
               }

               try {
                    await attendanceService.bulkCreate(payload);
               } catch (bulkErr) {
                    // Workaround: si el endpoint bulk falla (500), crear uno por uno para no bloquear el flujo
                    if (bulkErr?.response?.status === 500) {
                         const results = await Promise.allSettled(payload.map((row) => attendanceService.create(row)));
                         const failed = results.filter((r) => r.status === "rejected");
                         // Si falló todo, relanzar el error original para que lo vea el catch externo
                         if (failed.length === results.length) {
                              const allConflicts = failed.every((f) => f?.reason?.response?.status === 409);
                              if (allConflicts) {
                                   // Forzar manejo como "ya existe hoy"
                                   throw { response: { status: 409 } };
                              }
                              throw bulkErr;
                         }
                    } else {
                         throw bulkErr;
                    }
               }
               await refresh();
          } catch (err) {
               if (err?.response?.status === 409) {
                    await Swal.fire({
                         icon: "info",
                         title: "Fecha ya agregada",
                         text: `La fecha ${todayYmd} ya está agregada. No se puede crear otro día más.`,
                         confirmButtonColor: "#2563eb",
                    });
               } else {
                    console.error("Error starting day in classroom:", err);
                    await Swal.fire({
                         icon: "error",
                         title: "No se pudo empezar",
                         text: "Ocurrió un error al crear la fecha. Intenta nuevamente.",
                         confirmButtonColor: "#2563eb",
                    });
               }
          } finally {
               setStartingDay(false);
          }
     };

     const handleExport = async () => {
          const dateOptions = (dateColumns || []).map((d) => String(d).slice(0, 10)).filter(Boolean);
          const fmtShort = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
          const defaultDay =
               dateOptions.includes(todayYmd) ? todayYmd : (dateOptions[dateOptions.length - 1] || "");
          const optionsHtml =
               dateOptions.length > 0
                    ? dateOptions.map((d) => `<option value="${d}" ${d === defaultDay ? "selected" : ""}>${fmtShort(d)}</option>`).join("")
                    : `<option value="" selected>No hay fechas registradas</option>`;

          const res = await Swal.fire({
               title: "Exportar reporte",
               html: `
                 <style>
                   /* Keep scoped to this modal */
                   .swal2-popup.exp-modal{
                     border-radius:16px !important;
                     padding:18px 18px 14px !important;
                     box-shadow:0 24px 60px rgba(15,23,42,.22) !important;
                     border:1px solid #e2e8f0 !important;
                   }
                   .swal2-title.exp-title{
                     margin:0 0 10px 0 !important;
                     padding:0 !important;
                     font-size:16px !important;
                     font-weight:800 !important;
                     color:#0f172a !important;
                     text-align:left !important;
                   }
                   .swal2-html-container.exp-html{
                     margin:0 !important;
                     padding:0 !important;
                     text-align:left !important;
                   }
                   .swal2-actions.exp-actions{
                     margin:14px 0 0 !important;
                     padding-top:14px !important;
                     border-top:1px solid #e2e8f0 !important;
                     gap:10px !important;
                     justify-content:flex-end !important;
                   }
                   .swal2-confirm.exp-confirm{
                     border-radius:10px !important;
                     padding:10px 16px !important;
                     font-weight:800 !important;
                     box-shadow:0 8px 18px rgba(37,99,235,.24) !important;
                   }
                   .swal2-cancel.exp-cancel{
                     border-radius:10px !important;
                     padding:10px 16px !important;
                     font-weight:700 !important;
                   }

                   .exp-wrap{ color:#0f172a; }
                   .exp-grid{ display:grid; grid-template-columns:1fr; gap:12px; }
                   @media (min-width:620px){ .exp-grid{ grid-template-columns:1fr 1fr; } .exp-full{ grid-column:1 / -1; } }
                   .exp-label{ display:block; font-weight:700; font-size:12px; margin-bottom:6px; color:#0f172a; }
                   .exp-field{
                     width:100%;
                     height:44px;
                     padding:0 12px;
                     border-radius:12px;
                     border:1px solid #dbe3ef;
                     background:#fff;
                     outline:none;
                     transition: box-shadow .15s ease, border-color .15s ease;
                     box-sizing:border-box;
                   }
                   .exp-field:hover{ border-color:#cbd5e1; }
                   .exp-field:focus{ border-color:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,.16); }

                   /* Align select chevrons consistently */
                   select.exp-field{
                     -webkit-appearance:none;
                     -moz-appearance:none;
                     appearance:none;
                     padding-right:44px;
                     background-repeat:no-repeat;
                     background-position:right 14px center;
                     background-size:16px 16px;
                     background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                   }
                   select.exp-field::-ms-expand{ display:none; }

                   input[type='date'].exp-field{ padding-right:14px; }
                   .exp-muted{ color:#64748b; font-size:12px; line-height:1.35; }
                   .exp-note{
                     background:#f8fafc;
                     border:1px solid #e2e8f0;
                     border-radius:12px;
                     padding:10px 12px;
                   }
                   .exp-note b{ color:#0f172a; }
                 </style>
                 <div class="exp-wrap">
                   <div class="exp-grid">
                     <div>
                       <label class="exp-label" for="fmt">Formato</label>
                       <select id="fmt" class="exp-field">
                         <option value="pdf">PDF</option>
                         <option value="csv">Excel (CSV)</option>
                       </select>
                     </div>
                     <div>
                       <label class="exp-label" for="scope">Alcance</label>
                       <select id="scope" class="exp-field">
                         <option value="day">Un día</option>
                         <option value="all">Todos los días</option>
                       </select>
                     </div>
                     <div id="dateWrap" class="exp-full">
                       <label class="exp-label" for="day">Fecha</label>
                       <select id="day" class="exp-field" ${dateOptions.length === 0 ? "disabled" : ""}>
                         ${optionsHtml}
                       </select>
                       <div class="exp-muted" style="margin-top:6px">Solo se muestran fechas que ya están registradas en el aula.</div>
                     </div>
                     <div class="exp-note exp-full">
                       <div class="exp-muted">
                         <b>Todos los días</b> exporta todas las fechas registradas del aula.
                         En <b>PDF</b> se genera <b>una página por día</b>.
                       </div>
                     </div>
                   </div>
                 </div>
               `,
               didOpen: () => {
                    const scope = document.getElementById("scope");
                    const dateWrap = document.getElementById("dateWrap");
                    const fmt = document.getElementById("fmt");
                    const daySelect = document.getElementById("day");
                    const toggle = () => {
                         const isDay = scope.value === "day";
                         dateWrap.style.display = isDay ? "block" : "none";
                         if (isDay && daySelect && !daySelect.value) daySelect.value = "${defaultDay}";
                    };
                    scope.addEventListener("change", toggle);
                    fmt?.addEventListener("change", toggle);
                    toggle();
               },
               preConfirm: () => {
                    const fmt = document.getElementById("fmt").value;
                    const scope = document.getElementById("scope").value;
                    const day = document.getElementById("day")?.value;
                    return { fmt, scope, day };
               },
               width: 640,
               background: "#ffffff",
               customClass: {
                    popup: "exp-modal",
                    title: "exp-title",
                    htmlContainer: "exp-html",
                    actions: "exp-actions",
                    confirmButton: "exp-confirm",
                    cancelButton: "exp-cancel",
               },
               showCancelButton: true,
               confirmButtonText: "Exportar",
               cancelButtonText: "Cancelar",
               confirmButtonColor: "#2563eb",
               cancelButtonColor: "#64748b",
          });
          if (!res.isConfirmed) return;

          const { fmt, scope, day } = res.value || {};
          if (scope === "day" && !day) {
               await Swal.fire({
                    icon: "info",
                    title: "Sin fechas registradas",
                    text: "Aún no hay fechas registradas en este aula para exportar.",
                    confirmButtonColor: "#2563eb",
               });
               return;
          }
          const institutionRes = user?.institutionId ? await attendanceService.getInstitutionById(user.institutionId) : null;

          if (fmt === "pdf") {
               if (scope === "all") {
                    await exportAttendancePdfAllDays({
                         institutionResponse: institutionRes?.data ?? institutionRes,
                         classroomName: currentClassroom?.classroomName || "",
                         dateColumns,
                         students,
                         getCell,
                    });
                    return;
               }

               const dateYmd = day || todayYmd;
               const dayAttendances = (classroomAttendances || []).filter(
                    (a) => String(a.attendanceDate || "").slice(0, 10) === String(dateYmd).slice(0, 10)
               );
               await exportAttendancePdf({
                    institutionResponse: institutionRes?.data ?? institutionRes,
                    classroomName: currentClassroom?.classroomName || "",
                    dateYmd,
                    students,
                    attendances: dayAttendances,
               });
               return;
          }

          // CSV (Excel)
          const cols = scope === "day" ? [day || todayYmd] : dateColumns;
          exportAttendanceCsv({
               classroomName: currentClassroom?.classroomName || "",
               dateColumns: cols,
               students,
               getCell,
          });
     };


     return (
          <div className="min-h-screen bg-slate-50 p-6 space-y-4">
               <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                         <button
                              onClick={() => navigate("/auxiliar/asistencia")}
                              className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                         >
                              <ArrowLeft className="w-4 h-4" />
                              Volver
                         </button>
                         <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hoja de asistencia</p>
                              <p className="text-sm font-semibold text-slate-900">{currentClassroom?.classroomName || "Aula"}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Marca por fecha como una hoja de cálculo</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button
                              onClick={refresh}
                              disabled={sheetLoading}
                              className="p-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                              title="Actualizar"
                         >
                              <RefreshCw className={`w-4 h-4 ${sheetLoading ? "animate-spin" : ""}`} />
                         </button>
                         <button
                              onClick={handleStartDay}
                              disabled={sheetLoading || startingDay}
                              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                         >
                              <Play className="w-4 h-4" />
                              Empezar un nuevo día
                         </button>
                         <button
                              onClick={handleExport}
                              disabled={sheetLoading || startingDay}
                              className="px-4 py-2 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                         >
                              <Download className="w-4 h-4" />
                              Exportar
                         </button>
                         <button
                              onClick={() => setScanOpen(true)}
                              disabled={sheetLoading || startingDay}
                              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                         >
                              <QrCode className="w-4 h-4" />
                              Escanear ingreso / salida
                         </button>
                    </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                         <Users className="w-5 h-5 text-slate-600" />
                         <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total</p>
                              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
                         </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                         <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Presentes</p>
                              <p className="text-lg font-bold text-slate-900">{stats.present}</p>
                         </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                         <AlertTriangle className="w-5 h-5 text-amber-600" />
                         <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Justificados</p>
                              <p className="text-lg font-bold text-slate-900">{stats.justified}</p>
                         </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                         <AlertTriangle className="w-5 h-5 text-rose-600" />
                         <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Ausentes</p>
                              <p className="text-lg font-bold text-slate-900">{stats.absent}</p>
                         </div>
                    </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                         <table className="min-w-[980px] w-full text-sm">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                   <tr className="text-left">
                                        <th className="px-3 py-2 text-xs font-semibold text-slate-600">N°</th>
                                        <th className="px-3 py-2 text-xs font-semibold text-slate-600">DNI</th>
                                        <th className="px-3 py-2 text-xs font-semibold text-slate-600">Estudiante</th>
                                        {dateColumns.map((d) => (
                                             <th key={d} className="px-2 py-2 text-[11px] font-semibold text-slate-600 whitespace-nowrap text-center">
                                                  <button
                                                       type="button"
                                                       className="px-2 py-1 rounded-md hover:bg-slate-100"
                                                       title="Eliminar columna (fecha)"
                                                       onClick={async () => {
                                                            const confirm = await Swal.fire({
                                                                 icon: "warning",
                                                                 title: "Eliminar fecha",
                                                                 text: `¿Eliminar todos los registros del aula para la fecha ${d}?`,
                                                                 showCancelButton: true,
                                                                 confirmButtonText: "Sí, eliminar",
                                                                 cancelButtonText: "Cancelar",
                                                                 confirmButtonColor: "#dc2626",
                                                                 cancelButtonColor: "#6b7280",
                                                            });
                                                            if (!confirm.isConfirmed) return;

                                                            try {
                                                                 setSheetLoading(true);
                                                                 const ids = (classroomAttendances || [])
                                                                      .filter((a) => String(a.attendanceDate || "").slice(0, 10) === d)
                                                                      .map((a) => a.id)
                                                                      .filter(Boolean);

                                                                 await Promise.all(ids.map((id) => attendanceService.delete(id)));
                                                                 await refresh();
                                                            } catch (err) {
                                                                 console.error("Error deleting date column:", err);
                                                                 Swal.fire({
                                                                      icon: "error",
                                                                      title: "No se pudo eliminar",
                                                                      text: "Intenta nuevamente.",
                                                                      confirmButtonColor: "#2563eb",
                                                                 });
                                                            } finally {
                                                                 setSheetLoading(false);
                                                            }
                                                       }}
                                                  >
                                                       {d.slice(8, 10)}/{d.slice(5, 7)}
                                                  </button>
                                             </th>
                                        ))}
                                   </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                   {rows.map((r) => (
                                        <tr key={r.student.id} className="hover:bg-slate-50">
                                             <td className="px-3 py-2 text-slate-700">{r.idx}</td>
                                             <td className="px-3 py-2 text-slate-700 font-mono">{r.student.documentNumber || "-"}</td>
                                             <td className="px-3 py-2">
                                                  <div className="font-semibold text-slate-900">
                                                       {r.student.lastName} {r.student.firstName}
                                                  </div>
                                             </td>
                                             {dateColumns.map((d) => {
                                                  const cell = getCell(r.student.id, d);
                                                  const status = cell?.status || "";
                                                  const label = status === "PRESENT" ? "P" : status === "JUSTIFIED" ? "J" : status === "ABSENT" ? "A" : "";
                                                  const missingExit =
                                                       status === "PRESENT" && Boolean(cell?.arrivalTime) && !String(cell?.departureTime || "").trim();
                                                  const base =
                                                       status === "PRESENT"
                                                            ? "bg-emerald-600 text-white"
                                                            : status === "JUSTIFIED"
                                                                 ? "bg-amber-500 text-white"
                                                                 : status === "ABSENT"
                                                                      ? "bg-slate-700 text-white"
                                                                      : "bg-slate-100 text-slate-400";

                                                  return (
                                                       <td key={`${r.student.id}-${d}`} className="px-2 py-2 text-center">
                                                            <button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      const rect = e.currentTarget.getBoundingClientRect();
                                                                      setCellEditor({
                                                                           open: true,
                                                                           studentId: r.student.id,
                                                                           ymd: d,
                                                                           x: rect.left + rect.width / 2,
                                                                           y: rect.bottom + 8,
                                                                      });
                                                                 }}
                                                                 className={`relative w-7 h-7 rounded-md text-xs font-bold ${base} ${missingExit ? "ring-2 ring-amber-300" : ""}`}
                                                                 title={
                                                                      missingExit
                                                                           ? `Entrada registrada (${cell?.arrivalTime}). Falta registrar salida.`
                                                                           : `Editar (${d})`
                                                                 }
                                                            >
                                                                 {label || "-"}
                                                                 {missingExit && (
                                                                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 border border-white rounded-full" />
                                                                 )}
                                                            </button>
                                                       </td>
                                                  );
                                             })}
                                        </tr>
                                   ))}
                              </tbody>
                         </table>
                    </div>
                    {(!loading && !sheetLoading && rows.length === 0) && (
                         <div className="p-10 text-center text-slate-600">
                              No hay estudiantes en esta aula.
                         </div>
                    )}
               </div>

               <QRScannerModal open={scanOpen} onClose={() => setScanOpen(false)} onScan={handleScan} />

               {cellEditor.open && (
                    <CellEditorPopover
                         x={cellEditor.x}
                         y={cellEditor.y}
                         student={(students || []).find((s) => String(s.id) === String(cellEditor.studentId)) || null}
                         ymd={cellEditor.ymd}
                         cell={getCell(cellEditor.studentId, cellEditor.ymd)}
                         onClose={() => setCellEditor({ open: false, studentId: null, ymd: null, x: 0, y: 0 })}
                         onSave={async (patch, evidenceFile) => {
                              // asegurar celda
                              const ensured = await ensureCellExists({ studentId: cellEditor.studentId, ymd: cellEditor.ymd });
                              if (!ensured?.id) return;

                              let evidenceUrl = ensured.justificationDocumentUrl || "";
                              if (evidenceFile) {
                                   try {
                                        evidenceUrl = await uploadEvidence({ attendanceId: ensured.id, file: evidenceFile });
                                   } catch (err) {
                                        console.error("Error uploading evidence:", err);
                                        await Swal.fire({
                                             icon: "error",
                                             title: "No se pudo subir la evidencia",
                                             text: "Intenta nuevamente.",
                                             confirmButtonColor: "#2563eb",
                                        });
                                        return;
                                   }
                              }

                              const patchWithEvidence = evidenceUrl ? { ...patch, justificationDocumentUrl: evidenceUrl } : patch;
                              await saveCell({ studentId: cellEditor.studentId, ymd: cellEditor.ymd, patch: patchWithEvidence });
                         }}
                         onOpenDetail={() => setDetailModal({ open: true, studentId: cellEditor.studentId, ymd: cellEditor.ymd })}
                    />
               )}

               {detailModal.open && (
                    <DayDetailModal
                         student={(students || []).find((s) => String(s.id) === String(detailModal.studentId)) || null}
                         ymd={detailModal.ymd}
                         cell={getCell(detailModal.studentId, detailModal.ymd)}
                         onClose={() => setDetailModal({ open: false, studentId: null, ymd: null })}
                         onViewDocument={(url) => setDocModal({ open: true, url, title: "Documento de Justificación" })}
                    />
               )}

               <ViewDocumentModal
                    open={docModal.open}
                    onClose={() => setDocModal({ open: false, url: "", title: "" })}
                    documentUrl={docModal.url}
                    title={docModal.title || "Documento"}
               />
          </div>
     );
}

function CellEditorPopover({ x, y, student, ymd, cell, onClose, onSave, onOpenDetail }) {
     const [status, setStatus] = useState(cell?.status || "ABSENT");
     const [arrivalTime, setArrivalTime] = useState(cell?.arrivalTime || "");
     const [departureTime, setDepartureTime] = useState(cell?.departureTime || "");
     const [justificationReason, setJustificationReason] = useState(cell?.justificationReason || "");
     const [evidenceFile, setEvidenceFile] = useState(null);
     const [uploadHint, setUploadHint] = useState("");
     const [initial, setInitial] = useState({
          cellId: cell?.id || null,
          status: cell?.status || "ABSENT",
          arrivalTime: cell?.arrivalTime || "",
          departureTime: cell?.departureTime || "",
     });

     useEffect(() => {
          setStatus(cell?.status || "ABSENT");
          setArrivalTime(cell?.arrivalTime || "");
          setDepartureTime(cell?.departureTime || "");
          setJustificationReason(cell?.justificationReason || "");
          setEvidenceFile(null);
          setUploadHint("");
          setInitial({
               cellId: cell?.id || null,
               status: cell?.status || "ABSENT",
               arrivalTime: cell?.arrivalTime || "",
               departureTime: cell?.departureTime || "",
          });
     }, [cell?.id, cell?.status, cell?.arrivalTime, cell?.departureTime, cell?.justificationReason]);

     const canArrival = status === "PRESENT";
     const canDeparture = status === "PRESENT";
     const canJustify = status === "JUSTIFIED";
     const justifyMissing = canJustify && !String(justificationReason || "").trim();

     // Reglas de bloqueo:
     // - Si el registro ya existía como PRESENTE y ya tiene hora de ingreso, NO se puede cambiar ingreso.
     // - La salida se puede registrar si está vacía; una vez guardada, queda bloqueada.
     const isExistingRecord = Boolean(initial.cellId);
     const wasPresentPersisted = isExistingRecord && initial.status === "PRESENT";
     const lockArrival = wasPresentPersisted && Boolean(initial.arrivalTime);
     const lockDeparture = wasPresentPersisted && Boolean(initial.departureTime);
     const allowDepartureInput = canDeparture && !lockDeparture;
     const isClosedReadOnly = Boolean(cell?.status === "PRESENT" && cell?.arrivalTime && cell?.departureTime);

     return (
          <div className="fixed inset-0 z-50" onMouseDown={onClose}>
               <div
                    className="absolute"
                    style={{ left: Math.min(x, window.innerWidth - 360), top: Math.min(y, window.innerHeight - 260) }}
                    onMouseDown={(e) => e.stopPropagation()}
               >
                    <div className="w-[360px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                         <div className="px-4 py-3 border-b border-slate-200">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Editar</p>
                              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                   {student ? `${student.lastName} ${student.firstName}` : "Estudiante"} · {ymd}
                              </p>
                         </div>
                         <div className="p-4 space-y-3">
                              <div>
                                   <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                                   <select
                                        value={status}
                                        disabled={isClosedReadOnly}
                                        onChange={(e) => {
                                             const next = e.target.value;
                                             setStatus(next);
                                             if (next === "PRESENT") {
                                                  // Si viene de AUSENTE/JUSTIFICADO y no hay hora de ingreso, colocar por defecto
                                                  setArrivalTime((prev) => prev || getNowTimeHm());
                                             } else {
                                                  // Si deja de ser PRESENT, limpiar horas en UI (se guardará limpio)
                                                  setDepartureTime("");
                                             }
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                                   >
                                        <option value="ABSENT">Ausente</option>
                                        <option value="PRESENT">Presente</option>
                                        <option value="JUSTIFIED">Justificado</option>
                                   </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                   <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Hora ingreso</label>
                                        <input
                                             type="time"
                                             value={arrivalTime}
                                             disabled={isClosedReadOnly || !canArrival || lockArrival}
                                             onChange={(e) => setArrivalTime(e.target.value)}
                                             className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                                        />
                                        {lockArrival && <p className="mt-1 text-[11px] text-slate-500">Hora de ingreso bloqueada (registrada).</p>}
                                   </div>
                                   <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Hora salida</label>
                                        <input
                                             type="time"
                                             value={departureTime}
                                             disabled={isClosedReadOnly || !allowDepartureInput}
                                             onChange={(e) => setDepartureTime(e.target.value)}
                                             className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                                        />
                                        {lockDeparture && <p className="mt-1 text-[11px] text-slate-500">Hora de salida bloqueada (registrada).</p>}
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-xs font-semibold text-slate-700 mb-1">Justificación</label>
                                   <input
                                        value={justificationReason}
                                        disabled={isClosedReadOnly || !canJustify}
                                        onChange={(e) => setJustificationReason(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                                        placeholder={canJustify ? "Motivo..." : ""}
                                   />
                              </div>

                              <div>
                                   <label className="block text-xs font-semibold text-slate-700 mb-1">Evidencia (imagen/PDF)</label>
                                   <label
                                        className={`flex items-center justify-center px-3 py-2 border-2 border-dashed rounded-lg text-sm cursor-pointer transition-all ${
                                             canJustify && !isClosedReadOnly ? "border-slate-300 hover:border-primary-400 hover:bg-primary-50" : "border-slate-200 bg-slate-50 cursor-not-allowed"
                                        }`}
                                   >
                                        <div className={`flex items-center gap-2 ${canJustify ? "text-slate-700" : "text-slate-400"}`}>
                                             <Upload className="w-4 h-4" />
                                             <span>{evidenceFile ? evidenceFile.name : "Seleccionar archivo"}</span>
                                        </div>
                                        <input
                                             type="file"
                                             disabled={isClosedReadOnly || !canJustify}
                                             className="hidden"
                                             accept=".pdf,.jpg,.jpeg,.png,.webp"
                                             onChange={(e) => {
                                                  const f = e.target.files?.[0] || null;
                                                  setEvidenceFile(f);
                                                  setUploadHint(f ? "Se subirá al guardar" : "");
                                             }}
                                        />
                                   </label>
                                   {!!cell?.justificationDocumentUrl && !evidenceFile && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                                             <CheckCircle className="w-4 h-4" />
                                             Evidencia ya adjunta
                                        </div>
                                   )}
                                   {uploadHint && <div className="mt-1 text-xs text-slate-500">{uploadHint}</div>}
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                   <button type="button" onClick={onOpenDetail} className="text-sm font-semibold text-primary-700 hover:text-primary-800">
                                        Ver a detalle del día
                                   </button>
                                   <div className="flex gap-2">
                                        <button
                                             type="button"
                                             onClick={onClose}
                                             className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                        >
                                             Cerrar
                                        </button>
                                        {!isClosedReadOnly && (
                                             <button
                                                  type="button"
                                                  onClick={async () => {
                                                       if (justifyMissing) {
                                                            await Swal.fire({
                                                                 icon: "warning",
                                                                 title: "Motivo requerido",
                                                                 text: "Para marcar como Justificado es obligatorio ingresar el motivo.",
                                                                 confirmButtonColor: "#2563eb",
                                                            });
                                                            return;
                                                       }

                                                       // Si el usuario intenta guardar ambos horarios, avisar que ya no se podrán cambiar luego
                                                       const completingTimes = status === "PRESENT" && Boolean(arrivalTime) && Boolean(departureTime) && !lockDeparture;
                                                       if (completingTimes) {
                                                            const confirm = await Swal.fire({
                                                                 icon: "warning",
                                                                 title: "Confirmar horarios",
                                                                 text: "Al guardar con hora de ingreso y salida, ya no se podrán modificar después. ¿Deseas continuar?",
                                                                 showCancelButton: true,
                                                                 confirmButtonText: "Sí, guardar",
                                                                 cancelButtonText: "Cancelar",
                                                                 confirmButtonColor: "#2563eb",
                                                                 cancelButtonColor: "#6b7280",
                                                            });
                                                            if (!confirm.isConfirmed) return;
                                                       }

                                                       const patch = {
                                                            status,
                                                            arrivalTime: canArrival ? arrivalTime : "",
                                                            departureTime: canDeparture ? departureTime : "",
                                                            justificationReason: canJustify ? justificationReason : "",
                                                       };
                                                       await onSave(patch, canJustify ? evidenceFile : null);
                                                       onClose();
                                                  }}
                                                  className="px-3 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                                             >
                                                  Guardar
                                             </button>
                                        )}
                                   </div>
                              </div>
                              {isClosedReadOnly && (
                                   <div className="text-xs text-slate-500 pt-1">
                                        Registro cerrado: solo se permite ver el detalle.
                                   </div>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
}

function DayDetailModal({ student, ymd, cell, onClose, onViewDocument }) {
     const secureUrl = cell?.justificationDocumentUrl?.replace(/^http:/, "https:");
     const statusLabel =
          cell?.status === "PRESENT"
               ? "PRESENTE"
               : cell?.status === "JUSTIFIED"
                    ? "JUSTIFICADO"
                    : cell?.status === "ABSENT"
                         ? "AUSENTE"
                         : (cell?.status || "-");

     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={onClose}></div>
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
                         <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
                              <div>
                                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detalle del día</p>
                                   <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                        {student ? `${student.lastName} ${student.firstName}` : "Estudiante"} · {ymd}
                                   </p>
                              </div>
                              <button
                                   onClick={onClose}
                                   className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                              >
                                   Cerrar
                              </button>
                         </div>
                         <div className="p-5 space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                   <div className="border border-slate-200 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Estado</p>
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{statusLabel}</p>
                                   </div>
                                   <div className="border border-slate-200 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">DNI</p>
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{student?.documentNumber || "-"}</p>
                                   </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                   <div className="border border-slate-200 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Hora ingreso</p>
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{cell?.arrivalTime || "-"}</p>
                                   </div>
                                   <div className="border border-slate-200 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Hora salida</p>
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{cell?.departureTime || "-"}</p>
                                   </div>
                              </div>

                              <div className="border border-slate-200 rounded-lg p-3">
                                   <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Justificación</p>
                                   <p className="text-sm text-slate-900 mt-1">{cell?.justificationReason || "-"}</p>
                              </div>

                              {secureUrl ? (
                                   <button
                                        type="button"
                                        onClick={() => onViewDocument(secureUrl)}
                                        className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                                   >
                                        <FileText className="w-4 h-4" />
                                        Ver documento / imagen
                                   </button>
                              ) : (
                                   <div className="text-sm text-slate-500">Sin documento de justificación adjunto.</div>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
}

