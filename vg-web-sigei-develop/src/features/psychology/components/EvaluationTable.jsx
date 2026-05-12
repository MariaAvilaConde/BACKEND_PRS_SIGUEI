import React, { useState as useStateLocal, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Eye, Pencil, Trash2, RotateCcw, History, FileDown, MoreHorizontal, Play } from "lucide-react";
import { formatDateToSpanish } from "../utils/dateFormatter";
import { RiskBadge, calcRiskLevel, StatusBadge, InfoTooltip } from "./Badges";
import StudentTimelineModal from "./StudentTimelineModal";
import { exportStudentPDF } from "../utils/studentPdfExport";

const EVAL_TYPE_INFO = {
     INICIAL:     { label: "Inicial",     color: "bg-blue-100 text-blue-800",     desc: "Primera evaluación del estudiante. Establece una línea base de su estado psicológico." },
     SEGUIMIENTO: { label: "Seguimiento", color: "bg-cyan-100 text-cyan-800",     desc: "Evaluación de continuidad para monitorear la evolución del estudiante tras una evaluación previa." },
     ESPECIAL:    { label: "Especial",    color: "bg-purple-100 text-purple-800", desc: "Evaluación diferenciada para casos que requieren atención particular o protocolos específicos." },
     DERIVACION:  { label: "Derivación",  color: "bg-orange-100 text-orange-800", desc: "El caso ha sido escalado a un especialista externo o a otra área de atención." },
};

// ── Actions dropdown ──────────────────────────────────────────────────────────
function ActionsMenu({ evaluation, evaluations, onView, onEdit, onDelete, onRestore, onHardDelete, onStartScheduled, userRole, onTimeline }) {
     const [open, setOpen] = useStateLocal(false);
     const [menuPos, setMenuPos] = useStateLocal(null);
     const btnRef = useRef(null);

     useEffect(() => {
          if (!open) return;
          function handleClick(e) {
               // Cerrar si el click no es en el botón ni en el portal
               const portal = document.getElementById("__actions_portal__");
               if (
                    btnRef.current && !btnRef.current.contains(e.target) &&
                    portal && !portal.contains(e.target)
               ) {
                    setOpen(false);
                    setMenuPos(null);
               }
          }
          document.addEventListener("mousedown", handleClick);
          return () => document.removeEventListener("mousedown", handleClick);
     }, [open]);

     function handleToggle() {
          if (open) { setOpen(false); setMenuPos(null); return; }
          if (!btnRef.current) return;
          const r = btnRef.current.getBoundingClientRect();
          setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
          setOpen(true);
     }

     function close() { setOpen(false); setMenuPos(null); }

     const isActive = evaluation.status === "ACTIVE";
     const isScheduled = evaluation.status === "SCHEDULED";
     const studentEvs = evaluations.filter(e => String(e.studentId) === String(evaluation.studentId));

     const items = [
          { icon: Eye,      label: "Ver detalles",  color: "text-blue-600",    onClick: () => { close(); onView(evaluation); } },
          ...(isScheduled 
               ? [{ icon: Play, label: "Iniciar sesión", color: "text-green-600", onClick: () => { close(); onStartScheduled && onStartScheduled(evaluation); }, divider: false }]
               : [{ icon: Pencil,   label: "Editar",         color: "text-yellow-600",  onClick: () => { close(); onEdit(evaluation); } }]
          ),
          { icon: History,  label: "Ver historial",  color: "text-indigo-600",  onClick: () => { close(); onTimeline(studentEvs, evaluation.studentName); } },
          { icon: FileDown, label: "Exportar PDF",   color: "text-teal-600",    onClick: () => { close(); exportStudentPDF(evaluation.studentName, studentEvs); } },
          isActive
               ? { icon: Trash2,    label: "Desactivar",  color: "text-red-500",     onClick: () => { close(); onDelete(evaluation.id); }, divider: true }
               : isScheduled
               ? { icon: Trash2,    label: "Cancelar sesión",  color: "text-red-500",     onClick: () => { close(); onDelete(evaluation.id); }, divider: true }
               : { icon: RotateCcw, label: "Reactivar",   color: "text-emerald-600", onClick: () => { close(); onRestore && onRestore(evaluation.id); }, divider: true },
          ...(userRole === "ADMINISTRADOR"
               ? [{ icon: Trash2, label: "Eliminar permanente", color: "text-red-800", onClick: () => { close(); onHardDelete && onHardDelete(evaluation.id); } }]
               : []),
     ];

     return (
          <>
               <button
                    ref={btnRef}
                    onClick={handleToggle}
                    className={`p-1.5 rounded-lg transition-colors ${open ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"}`}
                    title="Acciones"
               >
                    <MoreHorizontal className="w-4 h-4" />
               </button>

               {open && menuPos && ReactDOM.createPortal(
                    <div
                         id="__actions_portal__"
                         style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
                         className="w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                    >
                         {items.map((item, i) => {
                              const Icon = item.icon;
                              return (
                                   <React.Fragment key={i}>
                                        {item.divider && <div className="border-t border-gray-100" />}
                                        <button
                                             onMouseDown={e => e.stopPropagation()}
                                             onClick={item.onClick}
                                             className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors ${item.color}`}
                                        >
                                             <Icon className="w-4 h-4 flex-shrink-0" />
                                             {item.label}
                                        </button>
                                   </React.Fragment>
                              );
                         })}
                    </div>,
                    document.body
               )}
          </>
     );
}

function Card({ children, padding = "p-6" }) {
     return (
          <div className={`bg-white rounded-lg shadow ${padding}`}>
               {children}
          </div>
     );
}

function Badge({ variant = "info", children }) {
     const variants = {
          info: "bg-blue-100 text-blue-800",
          warning: "bg-yellow-100 text-yellow-800",
          success: "bg-green-100 text-green-800",
     };

     return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[variant]}`}>
               {children}
          </span>
     );
}

function getEvaluationTypeColor(evaluationType) {
     const typeColors = {
          "INICIAL": { bg: "bg-blue-100", text: "text-blue-800" },
          "SEGUIMIENTO": { bg: "bg-cyan-100", text: "text-cyan-800" },
          "ESPECIAL": { bg: "bg-purple-100", text: "text-purple-800" },
          "DERIVACION": { bg: "bg-orange-100", text: "text-orange-800" },
     };
     
     return typeColors[evaluationType] || { bg: "bg-gray-100", text: "text-gray-800" };
}

function getSessionColor(sessionNumber) {
     const colors = [
          { bg: "bg-blue-100", text: "text-blue-800" },      // Sesión 1
          { bg: "bg-green-100", text: "text-green-800" },    // Sesión 2
          { bg: "bg-purple-100", text: "text-purple-800" },  // Sesión 3
          { bg: "bg-orange-100", text: "text-orange-800" },  // Sesión 4
          { bg: "bg-pink-100", text: "text-pink-800" },      // Sesión 5
          { bg: "bg-indigo-100", text: "text-indigo-800" },  // Sesión 6
          { bg: "bg-teal-100", text: "text-teal-800" },      // Sesión 7
          { bg: "bg-red-100", text: "text-red-800" },        // Sesión 8
          { bg: "bg-cyan-100", text: "text-cyan-800" },      // Sesión 9
          { bg: "bg-amber-100", text: "text-amber-800" },    // Sesión 10
     ];
     
     // Si hay más de 10 sesiones, repetir los colores
     const index = ((sessionNumber - 1) % colors.length);
     return colors[index];
}

export default function EvaluationTable({ evaluations, onView, onEdit, onDelete, onRestore, onHardDelete, onStartScheduled, userRole }) {
     const [expandedStudents, setExpandedStudents] = React.useState({});
     const [currentPage, setCurrentPage] = React.useState(1);
     const [timelineStudent, setTimelineStudent] = useStateLocal(null);
     const itemsPerPage = 7;

     function handleTimeline(studentEvs, name) {
          setTimelineStudent({ name, evaluations: studentEvs });
     }

     if (!evaluations || evaluations.length === 0) {
          return (
               <Card padding="p-8">
                    <div className="text-center text-gray-500">
                         <p className="text-lg font-medium">No hay evaluaciones registradas</p>
                         <p className="text-sm mt-1">Comienza creando tu primera evaluación psicológica</p>
                    </div>
               </Card>
          );
     }

     // Agrupar evaluaciones por estudiante
     const evaluationsByStudent = {};
     evaluations.forEach(evaluation => {
          if (!evaluationsByStudent[evaluation.studentId]) {
               evaluationsByStudent[evaluation.studentId] = {
                    studentName: evaluation.studentName,
                    evaluations: []
               };
          }
          evaluationsByStudent[evaluation.studentId].evaluations.push(evaluation);
     });

     // Ordenar evaluaciones dentro de cada grupo por número de sesión
     Object.keys(evaluationsByStudent).forEach(studentId => {
          evaluationsByStudent[studentId].evaluations.sort((a, b) => 
               (a.sessionNumber || 0) - (b.sessionNumber || 0)
          );
     });

     // Convertir a array para paginación (cada estudiante cuenta como 1 item)
     const studentGroups = Object.entries(evaluationsByStudent);
     const totalPages = Math.ceil(studentGroups.length / itemsPerPage);
     const startIndex = (currentPage - 1) * itemsPerPage;
     const endIndex = startIndex + itemsPerPage;
     const paginatedGroups = studentGroups.slice(startIndex, endIndex);

     const toggleStudent = (studentId) => {
          setExpandedStudents(prev => ({
               ...prev,
               [studentId]: !prev[studentId]
          }));
     };

     const goToPage = (page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
     };

     const renderPagination = () => {
          const maxVisiblePages = 5;
          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

          if (endPage - startPage < maxVisiblePages - 1) {
               startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }

          return (
               <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                         <button
                              onClick={() => goToPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              Anterior
                         </button>
                         <button
                              onClick={() => goToPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              Siguiente
                         </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                         <div>
                              <p className="text-sm text-gray-700">
                                   Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                                   <span className="font-medium">{Math.min(endIndex, studentGroups.length)}</span> de{' '}
                                   <span className="font-medium">{studentGroups.length}</span> registros
                              </p>
                         </div>
                         <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                   <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <span className="sr-only">Primera</span>
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                                   <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <span className="sr-only">Anterior</span>
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                                   {startPage > 1 && (
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                             ...
                                        </span>
                                   )}
                                   {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                                        <button
                                             key={page}
                                             onClick={() => goToPage(page)}
                                             className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                  page === currentPage
                                                       ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                                       : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                             }`}
                                        >
                                             {page}
                                        </button>
                                   ))}
                                   {endPage < totalPages && (
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                             ...
                                        </span>
                                   )}
                                   <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <span className="sr-only">Siguiente</span>
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                                   <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <span className="sr-only">Última</span>
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-6 0a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                              </nav>
                         </div>
                    </div>
               </div>
          );
     };

     return (
     <>
          <Card padding="p-0">
               <div className="overflow-x-auto">
                    <table className="w-full">
                         <thead className="bg-gray-800 text-white">
                              <tr>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Sesión
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Estudiante
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Institución
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Aula
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Tipo
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Fecha
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Evaluador
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Seguimiento
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Estado
                                   </th>
                                   <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                                        Acciones
                                   </th>
                              </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedGroups.map(([studentId, studentData]) => {
                                   const sessionCount = studentData.evaluations.length;
                                   const showGroupHeader = sessionCount >= 2;
                                   const isExpanded = expandedStudents[studentId] !== false; // Por defecto expandido
                                   
                                   return (
                                        <React.Fragment key={studentId}>
                                             {showGroupHeader && (
                                                  <tr 
                                                       className="bg-blue-50 border-l-4 border-blue-600 cursor-pointer hover:bg-blue-100 transition-all duration-200"
                                                       onClick={() => toggleStudent(studentId)}
                                                  >
                                                       <td colSpan="10" className="px-4 py-2.5">
                                                            <div className="flex items-center justify-between">
                                                                 <div className="flex items-center gap-3">
                                                                      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                                                                           <svg 
                                                                                className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                                                                                fill="none" 
                                                                                stroke="currentColor" 
                                                                                viewBox="0 0 24 24"
                                                                                strokeWidth={2.5}
                                                                           >
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                           </svg>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                           </svg>
                                                                           <span className="text-sm font-bold text-gray-900">
                                                                                {studentData.studentName}
                                                                           </span>
                                                                      </div>
                                                                      <span className="text-xs text-gray-500">•</span>
                                                                      <span className="text-xs text-gray-600 font-medium">
                                                                           {sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'}
                                                                      </span>
                                                                      <RiskBadge level={calcRiskLevel(studentData.evaluations)} evaluations={studentData.evaluations} />
                                                                 </div>
                                                                 <div className="flex items-center gap-2">
                                                                      <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-bold shadow-sm">
                                                                           {sessionCount} {sessionCount === 1 ? 'Sesión' : 'Sesiones'}
                                                                      </span>
                                                                 </div>
                                                            </div>
                                                       </td>
                                                  </tr>
                                             )}
                                             {(!showGroupHeader || isExpanded) && studentData.evaluations.map((evaluation) => (
                                                  <tr key={evaluation.id} className={`hover:bg-gray-50 transition-colors ${showGroupHeader ? 'bg-gray-50/50' : ''}`}>
                                                       <td className={`py-3 whitespace-nowrap ${showGroupHeader ? 'pl-12 pr-4' : 'px-4'}`}>
                                                            <div className="flex items-center gap-2">
                                                                 {(() => {
                                                                      const studentEvs = evaluations
                                                                           .filter(e => String(e.studentId) === String(evaluation.studentId))
                                                                           .sort((a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate));
                                                                      const totalSessions = studentEvs.length;
                                                                      const currentIndex = studentEvs.findIndex(e => e.id === evaluation.id);
                                                                      const currentSession = currentIndex >= 0 ? currentIndex + 1 : 1;
                                                                      const sessionColor = getSessionColor(currentSession);
                                                                      return (
                                                                           <div className={`px-2 py-1 ${sessionColor.bg} ${sessionColor.text} rounded-full text-xs font-bold`}>
                                                                                {currentSession}/{totalSessions} sesión{totalSessions !== 1 ? 'es' : ''}
                                                                           </div>
                                                                      );
                                                                 })()}
                                                            </div>
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                 {evaluation.studentName}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                 <span className="text-xs text-gray-500">Año {evaluation.academicYear}</span>
                                                                 {!showGroupHeader && (
                                                                      <RiskBadge level={calcRiskLevel(studentData.evaluations)} evaluations={studentData.evaluations} />
                                                                 )}
                                                            </div>
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 max-w-[200px] truncate" title={evaluation.institutionName}>
                                                                 {evaluation.institutionName}
                                                            </div>
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {evaluation.classroomName}
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap">
                                                            {(() => {
                                                                 const info = EVAL_TYPE_INFO[evaluation.evaluationType] || { label: evaluation.evaluationType, color: "bg-gray-100 text-gray-800", desc: "" };
                                                                 return (
                                                                      <InfoTooltip title={info.label} content={info.desc}>
                                                                           <span className={`px-2 py-1 text-xs font-medium rounded-full cursor-help ${info.color}`}>
                                                                                {info.label}
                                                                           </span>
                                                                      </InfoTooltip>
                                                                 );
                                                            })()}
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDateToSpanish(evaluation.evaluationDate)}
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {evaluation.evaluatorName}
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap">
                                                            {evaluation.requiresFollowUp ? (
                                                                 <Badge variant="warning">Sí</Badge>
                                                            ) : (
                                                                 <Badge variant="success">No</Badge>
                                                            )}
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap">
                                                            <StatusBadge status={evaluation.status} />
                                                       </td>
                                                       <td className="px-4 py-3 whitespace-nowrap text-center">
                                                            <ActionsMenu
                                                                 evaluation={evaluation}
                                                                 evaluations={evaluations}
                                                                 onView={onView}
                                                                 onEdit={onEdit}
                                                                 onDelete={onDelete}
                                                                 onRestore={onRestore}
                                                                 onHardDelete={onHardDelete}
                                                                 onStartScheduled={onStartScheduled}
                                                                 userRole={userRole}
                                                                 onTimeline={handleTimeline}
                                                            />
                                                       </td>
                                                  </tr>
                                             ))}
                                        </React.Fragment>
                                   );
                              })}
                         </tbody>
                    </table>
               </div>
               {renderPagination()}
          </Card>

          {timelineStudent && (
               <StudentTimelineModal
                    isOpen={!!timelineStudent}
                    onClose={() => setTimelineStudent(null)}
                    studentName={timelineStudent.name}
                    evaluations={timelineStudent.evaluations}
               />
          )}
     </>
     );
}