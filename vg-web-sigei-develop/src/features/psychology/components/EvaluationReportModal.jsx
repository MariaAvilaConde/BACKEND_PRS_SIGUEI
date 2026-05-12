import { useState } from "react";
import { FileText, X, Download, CheckCircle2, XCircle, LayoutList, Loader2, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import { exportEvaluationsCSV } from "../utils/csvExport";
import { drawHeader, drawTable, loadLogoBase64 } from "@/core/utils/reportGenerator";

const REPORT_OPTIONS = [
     { key: "active",   label: "Solo Activas",   description: "Evaluaciones con estado ACTIVE",   icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", selected: "bg-emerald-600 text-white border-emerald-600" },
     { key: "inactive", label: "Solo Inactivas",  description: "Evaluaciones con estado INACTIVE", icon: XCircle,      color: "text-red-500",     bg: "bg-red-50 border-red-200",         selected: "bg-red-500 text-white border-red-500" },
     { key: "all",      label: "Todas",           description: "Activas e inactivas",              icon: LayoutList,   color: "text-primary-600", bg: "bg-primary-50 border-primary-200", selected: "bg-primary-600 text-white border-primary-600" },
];

function fmtDate(d) {
     if (!d) return "—";
     try {
          const s = typeof d === "string" ? d.replace(/(\.\d{3})\d+/, "$1") : d;
          const dt = new Date(typeof s === "string" && !s.includes("T") ? s + "T00:00:00" : s);
          return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
     } catch { return "—"; }
}

export default function EvaluationReportModal({ isOpen, onClose, evaluations, institution }) {
     const [selected, setSelected] = useState("all");
     const [generating, setGenerating] = useState(false);

     if (!isOpen) return null;

     const filtered = evaluations.filter(ev =>
          selected === "active" ? ev.status === "ACTIVE" :
          selected === "inactive" ? ev.status === "INACTIVE" : true
     );

     const groupsCount = new Set(filtered.map((ev) => String(ev.studentId || ev.studentName || ""))).size;

     async function handleGenerate() {
          setGenerating(true);
          try {
               // Compresión para reducir el peso del PDF
               const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
               const labelMap = { active: "Activas", inactive: "Inactivas", all: "Todas" };
               const inst = institution || { name: filtered[0]?.institutionName || "Institución Educativa" };
               // El logo (imagen embebida) suele ser lo que más pesa en el PDF.
               // Si es grande, lo omitimos para mantener el PDF liviano.
               let logoBase64 = await loadLogoBase64(inst.logoUrl);
               if (logoBase64 && String(logoBase64).length > 18000) {
                    logoBase64 = null;
               }
               const subtitle = `Filtro: ${labelMap[selected]} · Total: ${filtered.length} evaluaciones · ${groupsCount} estudiantes`;

               // Tabla principal (mismo estilo que Asistencia)
               const startY = drawHeader(pdf, inst, "Reporte de Evaluaciones Psicológicas", subtitle, logoBase64);
               const headers = ["Sesión", "Estudiante", "Institución", "Aula", "Tipo", "Fecha", "Evaluador", "Seguimiento", "Estado"];
               const colWidths = [18, 40, 50, 25, 25, 24, 35, 20, 20];

               const rows = filtered
                    .slice()
                    .sort((a, b) => {
                         const an = String(a.studentName || "").localeCompare(String(b.studentName || ""));
                         if (an !== 0) return an;
                         return (a.sessionNumber || 0) - (b.sessionNumber || 0);
                    })
                    .map((ev) => ([
                         `#${ev.sessionNumber || 1}`,
                         ev.studentName || "",
                         ev.institutionName || "",
                         ev.classroomName || "",
                         ev.evaluationType || "",
                         fmtDate(ev.evaluationDate),
                         ev.evaluatorName || "",
                         ev.requiresFollowUp ? "Sí" : "No",
                         ev.status === "ACTIVE" ? "Activa" : ev.status === "INACTIVE" ? "Inactiva" : (ev.status || ""),
                    ]));

               drawTable(pdf, headers, colWidths, rows, startY, inst, "Reporte de Evaluaciones Psicológicas", subtitle, logoBase64);

               // Segunda tabla: áreas de desarrollo (si hay contenido)
               const evWithDev = filtered.filter((ev) =>
                    ev.emotionalDevelopment || ev.socialDevelopment || ev.cognitiveDevelopment || ev.motorDevelopment
               );
               if (evWithDev.length > 0) {
                    pdf.addPage();
                    const startY2 = drawHeader(pdf, inst, "Áreas de Desarrollo Psicológico", subtitle, logoBase64);
                    const headers2 = ["Estudiante", "Sesión", "Emocional", "Social", "Cognitivo", "Motor"];
                    const colWidths2 = [45, 18, 52, 52, 52, 48];
                    const rows2 = evWithDev
                         .slice()
                         .sort((a, b) => {
                              const an = String(a.studentName || "").localeCompare(String(b.studentName || ""));
                              if (an !== 0) return an;
                              return (a.sessionNumber || 0) - (b.sessionNumber || 0);
                         })
                         .map((ev) => ([
                              ev.studentName || "",
                              `#${ev.sessionNumber || 1}`,
                              ev.emotionalDevelopment || "—",
                              ev.socialDevelopment || "—",
                              ev.cognitiveDevelopment || "—",
                              ev.motorDevelopment || "—",
                         ]));
                    drawTable(pdf, headers2, colWidths2, rows2, startY2, inst, "Áreas de Desarrollo Psicológico", subtitle, logoBase64);
               }

               pdf.save(`reporte-evaluaciones-psicologia-${selected}-${Date.now()}.pdf`);
               onClose();
          } catch (err) {
               console.error("Error generando PDF:", err);
          } finally {
               setGenerating(false);
          }
     }

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
               <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
               <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-700 to-primary-500 px-6 py-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                   <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                   <h2 className="text-white font-bold text-base leading-none">Generar Reporte PDF</h2>
                                   <p className="text-primary-200 text-xs mt-0.5">Evaluaciones agrupadas por sesión</p>
                              </div>
                         </div>
                         <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                              <X className="w-5 h-5" />
                         </button>
                    </div>

                    <div className="p-6">
                         <p className="text-sm text-gray-500 mb-4">Selecciona qué evaluaciones deseas incluir en el reporte:</p>
                         <div className="space-y-2.5">
                              {REPORT_OPTIONS.map(opt => {
                                   const Icon = opt.icon;
                                   const isSel = selected === opt.key;
                                   const count = evaluations.filter(ev =>
                                        opt.key === "active" ? ev.status === "ACTIVE" :
                                        opt.key === "inactive" ? ev.status === "INACTIVE" : true
                                   ).length;
                                   return (
                                        <button key={opt.key} onClick={() => setSelected(opt.key)}
                                             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${isSel ? opt.selected : `${opt.bg} hover:opacity-80`}`}>
                                             <Icon className={`w-5 h-5 flex-shrink-0 ${isSel ? "text-white" : opt.color}`} />
                                             <div>
                                                  <p className={`text-sm font-semibold ${isSel ? "text-white" : "text-gray-800"}`}>{opt.label}</p>
                                                  <p className={`text-xs ${isSel ? "text-white/80" : "text-gray-500"}`}>{opt.description}</p>
                                             </div>
                                             <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${isSel ? "bg-white/20 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                                                  {count}
                                             </span>
                                        </button>
                                   );
                              })}
                         </div>
                         <div className="mt-5 pt-4 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-3">
                                   <p className="text-xs text-gray-400">
                                        <span className="font-semibold text-gray-700">{filtered.length}</span> evaluaciones · <span className="font-semibold text-gray-700">{groupsCount}</span> estudiantes
                                   </p>
                                   <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                        Cancelar
                                   </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                   <button
                                        onClick={() => { exportEvaluationsCSV(filtered, `evaluaciones-${selected}`); onClose(); }}
                                        disabled={filtered.length === 0}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar CSV
                                   </button>
                                   <button
                                        onClick={handleGenerate}
                                        disabled={generating || filtered.length === 0}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                   >
                                        {generating
                                             ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                                             : <><Download className="w-4 h-4" /> Descargar PDF</>}
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
