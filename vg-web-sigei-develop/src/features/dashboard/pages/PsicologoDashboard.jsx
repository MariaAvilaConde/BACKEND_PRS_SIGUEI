import { useEffect } from "react";
import { Brain, Clock, AlertTriangle, Users, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/auth/AuthContext";
import { usePsychology } from "../../psychology/hooks/usePsychology";
import PsychologyCharts from "../../psychology/components/PsychologyCharts";
import FollowUpPanel from "../../psychology/components/FollowUpPanel";
import { calcRiskLevel } from "../../psychology/components/Badges";

const MONTHS_ES    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getMonthCount(evaluations, offset = 0) {
     const d = new Date();
     const t = new Date(d.getFullYear(), d.getMonth() + offset, 1);
     return evaluations.filter(e => {
          if (!e.evaluationDate) return false;
          const ed = new Date(e.evaluationDate);
          return ed.getFullYear() === t.getFullYear() && ed.getMonth() === t.getMonth();
     }).length;
}

function fmtDate(d) {
     if (!d) return "—";
     try {
          const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
          return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`;
     } catch { return d; }
}

const TYPE_LABEL = { INICIAL: "Inicial", SEGUIMIENTO: "Seguimiento", ESPECIAL: "Especial", DERIVACION: "Derivación" };
const TYPE_DOT   = { INICIAL: "bg-blue-500", SEGUIMIENTO: "bg-violet-500", ESPECIAL: "bg-amber-500", DERIVACION: "bg-rose-500" };

export default function PsicologoDashboard() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const { evaluations, fetchAll, loading } = usePsychology(user);

     useEffect(() => { fetchAll(); }, [fetchAll]);

     const now            = new Date();
     const active         = evaluations.filter(e => e.status === "ACTIVE");
     const followUp       = evaluations.filter(e => e.requiresFollowUp && e.status === "ACTIVE");
     const uniqueStudents = new Set(evaluations.map(e => e.studentId)).size;

     const studentMap = {};
     evaluations.forEach(ev => {
          if (!studentMap[ev.studentId]) studentMap[ev.studentId] = [];
          studentMap[ev.studentId].push(ev);
     });
     const highRisk  = Object.values(studentMap).filter(evs => calcRiskLevel(evs) === "high").length;
     const thisMonth = getMonthCount(active, 0);
     const lastMonth = getMonthCount(active, -1);
     const diff      = thisMonth - lastMonth;

     const recent = [...active]
          .sort((a, b) => new Date(b.evaluationDate || 0) - new Date(a.evaluationDate || 0))
          .slice(0, 6);

     return (
          <div className="space-y-5">

               {/* Header */}
               <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">
                         {MONTHS_ES[now.getMonth()]} {now.getFullYear()}
                    </p>
                    <h1 className="text-2xl font-semibold text-gray-900">Panel de Psicología</h1>
               </div>

               {/* KPIs */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                         { label: "Evaluaciones activas", value: active.length,   icon: Brain,         accent: "border-l-blue-500"  },
                         { label: "Estudiantes",          value: uniqueStudents,  icon: Users,         accent: "border-l-gray-400"  },
                         { label: "Con seguimiento",      value: followUp.length, icon: Clock,         accent: "border-l-amber-400" },
                         { label: "Riesgo alto",          value: highRisk,        icon: AlertTriangle, accent: "border-l-rose-500"  },
                    ].map(s => {
                         const Icon = s.icon;
                         return (
                              <div key={s.label} className={`bg-white border border-gray-200 border-l-4 ${s.accent} rounded-lg px-4 py-4`}>
                                   <div className="flex items-start justify-between">
                                        <div>
                                             <p className="text-3xl font-bold text-gray-900 leading-none">
                                                  {loading ? <span className="text-gray-300">—</span> : s.value}
                                             </p>
                                             <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
                                        </div>
                                        <Icon className="w-4 h-4 text-gray-300 mt-1" />
                                   </div>
                              </div>
                         );
                    })}
               </div>

               {/* Tendencia */}
               {!loading && (
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                         <span>Este mes:</span>
                         <span className="font-semibold text-gray-800">{thisMonth} evaluaciones</span>
                         {diff !== 0 && (
                              <span className={`font-medium ${diff > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                   {diff > 0 ? "↑" : "↓"} {Math.abs(diff)} respecto al mes anterior
                              </span>
                         )}
                    </div>
               )}

               {/* Fila principal: gráficos + recientes + seguimientos */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                    {/* Gráficos — ocupa 2 columnas en desktop */}
                    <div className="lg:col-span-2 space-y-4">
                         <PsychologyCharts evaluations={evaluations} />
                         <FollowUpPanel evaluations={evaluations} />
                    </div>

                    {/* Columna derecha: recientes */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                         <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                              <p className="text-sm font-semibold text-gray-700">Últimas evaluaciones</p>
                              <button
                                   onClick={() => navigate("/psicologo/evaluaciones")}
                                   className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
                              >
                                   Ver todas <ArrowUpRight className="w-3 h-3" />
                              </button>
                         </div>

                         <div className="divide-y divide-gray-50">
                              {loading ? (
                                   Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                                             <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                                             <div className="flex-1 space-y-1.5">
                                                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                                                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                                             </div>
                                        </div>
                                   ))
                              ) : recent.length === 0 ? (
                                   <p className="text-sm text-gray-400 text-center py-8">Sin evaluaciones</p>
                              ) : (
                                   recent.map(ev => (
                                        <div key={ev.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                             <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                                                  {(ev.studentName || "?")[0].toUpperCase()}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-sm text-gray-800 font-medium truncate">{ev.studentName}</p>
                                                  <p className="text-xs text-gray-400">{fmtDate(ev.evaluationDate)}</p>
                                             </div>
                                             <div className="flex items-center gap-1.5 flex-shrink-0">
                                                  <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[ev.evaluationType] || "bg-gray-300"}`} />
                                                  <span className="text-xs text-gray-500">{TYPE_LABEL[ev.evaluationType] || ev.evaluationType}</span>
                                             </div>
                                        </div>
                                   ))
                              )}
                         </div>
                    </div>
               </div>

          </div>
     );
}
