import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { competencyService, capacityService, performanceService } from "../services/academicService";
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import CompetencyForm from "./CompetencyForm";
import CapacityForm from "./CapacityForm";
import PerformanceForm from "./PerformanceForm";

export default function CompetencyTreeView({ course }) {
     const { user } = useAuth();
     const [competencies, setCompetencies] = useState([]);
     const [expandedCompetencies, setExpandedCompetencies] = useState(new Set());
     const [expandedCapacities, setExpandedCapacities] = useState(new Set());
     const [showInactive, setShowInactive] = useState(false);
     const [loading, setLoading] = useState(false);
     const [localStatus, setLocalStatus] = useState({});

     const getStatus = (id, original) => localStatus[id] ?? original;
     const isInactive = (id, original) => String(getStatus(id, original)).toUpperCase() === "INACTIVE";
     const [showCompetencyForm, setShowCompetencyForm]   = useState(false);
     const [editingCompetency, setEditingCompetency]     = useState(null);
     const [showCapacityForm, setShowCapacityForm]       = useState(false);
     const [editingCapacity, setEditingCapacity]         = useState(null);
     const [selectedCompetencyForCapacity, setSelectedCompetencyForCapacity] = useState(null);
     const [showPerformanceForm, setShowPerformanceForm] = useState(false);
     const [editingPerformance, setEditingPerformance]   = useState(null);
     const [selectedCapacityForPerformance, setSelectedCapacityForPerformance] = useState(null);

     useEffect(() => {
          loadData();
     }, [course.id, showInactive]);

     const loadData = async () => {
          try {
               setLoading(true);
               setLocalStatus({}); 
               const comps = showInactive
                    ? await competencyService.getByCourse(course.id)
                    : await competencyService.getActiveByCourse(course.id);

               const compsWithData = await Promise.all(
                    comps.map(async (comp) => {
                         const capacities = showInactive
                              ? await capacityService.getByCompetency(comp.id)
                              : await capacityService.getActiveByCompetency(comp.id);

                         const capsWithPerformances = await Promise.all(
                              capacities.map(async (cap) => {
                                   const performances = showInactive
                                        ? await performanceService.getByCapacity(cap.id)
                                        : await performanceService.getActiveByCapacity(cap.id);
                                   return { ...cap, performances };
                              })
                         );
                         return { ...comp, capacities: capsWithPerformances };
                    })
               );
               setCompetencies(compsWithData);
          } catch (error) {
               console.error("Error al cargar datos:", error);
          } finally {
               setLoading(false);
          }
     };

     const markLocal = (id, status) =>
          setLocalStatus((prev) => ({ ...prev, [id]: status }));

     const clearLocal = (id) =>
          setLocalStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });

     const toggleCompetency = (id) => {
          const s = new Set(expandedCompetencies);
          s.has(id) ? s.delete(id) : s.add(id);
          setExpandedCompetencies(s);
     };
     const toggleCapacity = (id) => {
          const s = new Set(expandedCapacities);
          s.has(id) ? s.delete(id) : s.add(id);
          setExpandedCapacities(s);
     };

     const handleAddCompetency = () => {
          setEditingCompetency({ id: "", courseId: course.id, institutionId: user.institutionId, code: "", name: "", description: "", orderIndex: 1, status: "ACTIVE" });
          setShowCompetencyForm(true);
     };
     const handleAddCapacity = (comp) => {
          setSelectedCompetencyForCapacity(comp);
          setEditingCapacity({ id: "", competencyId: comp.id, institutionId: user.institutionId, code: "", name: "", description: "", orderIndex: 1, status: "ACTIVE" });
          setShowCapacityForm(true);
     };
     const handleAddPerformance = (cap) => {
          setSelectedCapacityForPerformance(cap);
          setEditingPerformance({ id: "", capacityId: cap.id, institutionId: user.institutionId, code: "", description: "", ageLevel: course.ageLevel, orderIndex: 1, status: "ACTIVE" });
          setShowPerformanceForm(true);
     };

     const handleSaveCompetency = async (formData) => {
          try {
               formData.id?.trim() ? await competencyService.update(formData.id, formData) : await competencyService.create(formData);
               setShowCompetencyForm(false); setEditingCompetency(null); loadData();
          } catch { alert("Error al guardar la competencia"); }
     };
     const handleSaveCapacity = async (formData) => {
          try {
               formData.id?.trim() ? await capacityService.update(formData.id, formData) : await capacityService.create(formData);
               setShowCapacityForm(false); setEditingCapacity(null); setSelectedCompetencyForCapacity(null); loadData();
          } catch { alert("Error al guardar la capacidad"); }
     };
     const handleSavePerformance = async (formData) => {
          try {
               formData.id?.trim() ? await performanceService.update(formData.id, formData) : await performanceService.create(formData);
               setShowPerformanceForm(false); setEditingPerformance(null); setSelectedCapacityForPerformance(null); loadData();
          } catch { alert("Error al guardar el desempeño"); }
     };

     const handleDeleteCompetency = async (id) => {
          if (!confirm("¿Eliminar esta competencia?")) return;
          try { await competencyService.delete(id); markLocal(id, "INACTIVE"); }
          catch (e) { console.error(e); }
     };
     const handleDeleteCapacity = async (id) => {
          if (!confirm("¿Eliminar esta capacidad?")) return;
          try { await capacityService.delete(id); markLocal(id, "INACTIVE"); }
          catch (e) { console.error(e); }
     };
     const handleDeletePerformance = async (id) => {
          if (!confirm("¿Eliminar este desempeño?")) return;
          try { await performanceService.delete(id); markLocal(id, "INACTIVE"); }
          catch (e) { console.error(e); }
     };

     const handleRestoreCompetency = async (id) => {
          try { await competencyService.restore(id); clearLocal(id); loadData(); }
          catch (e) { console.error(e); }
     };
     const handleRestoreCapacity = async (id) => {
          try { await capacityService.restore(id); clearLocal(id); loadData(); }
          catch (e) { console.error(e); }
     };
     const handleRestorePerformance = async (id) => {
          try { await performanceService.restore(id); clearLocal(id); loadData(); }
          catch (e) { console.error(e); }
     };

     if (loading) return <div className="text-center py-8 text-sm text-gray-400">Cargando...</div>;

     return (
          <div className="space-y-4">
               {}
               <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                         <h3 className="text-base font-semibold text-gray-800">
                              Competencias, Capacidades y Desempeños
                         </h3>
                         <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                   type="checkbox"
                                   checked={showInactive}
                                   onChange={(e) => setShowInactive(e.target.checked)}
                                   className="rounded"
                              />
                              <span className="text-gray-600">Mostrar inactivos</span>
                         </label>
                    </div>
                    <button
                         onClick={handleAddCompetency}
                         className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                         <Plus className="w-4 h-4" /> Nueva Competencia
                    </button>
               </div>

               {}
               {showCompetencyForm && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                              <CompetencyForm competency={editingCompetency} onSave={handleSaveCompetency} onCancel={() => { setShowCompetencyForm(false); setEditingCompetency(null); }} saving={false} />
                         </div>
                    </div>
               )}
               {showCapacityForm && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                              <CapacityForm capacity={editingCapacity} onSave={handleSaveCapacity} onCancel={() => { setShowCapacityForm(false); setEditingCapacity(null); setSelectedCompetencyForCapacity(null); }} saving={false} />
                         </div>
                    </div>
               )}
               {showPerformanceForm && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                              <PerformanceForm performance={editingPerformance} ageLevel={course.ageLevel} onSave={handleSavePerformance} onCancel={() => { setShowPerformanceForm(false); setEditingPerformance(null); setSelectedCapacityForPerformance(null); }} saving={false} />
                         </div>
                    </div>
               )}

               {}
               {competencies.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                         <p className="text-gray-500 text-sm">No hay competencias registradas</p>
                    </div>
               ) : (
                    <div className="space-y-3">
                         {competencies.map((comp) => {
                              const compInactive = isInactive(comp.id, comp.status);
                              return (
                                   <div key={comp.id} className={`border border-gray-200 rounded-lg bg-white ${compInactive ? "opacity-60" : ""}`}>
                                        {}
                                        <div className="p-4 bg-blue-50 rounded-t-lg">
                                             <div className="flex items-start gap-3">
                                                  <button onClick={() => toggleCompetency(comp.id)} className="mt-1 text-blue-600 hover:text-blue-700">
                                                       {expandedCompetencies.has(comp.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                  </button>
                                                  <div className="flex-1">
                                                       <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold">{comp.code}</span>
                                                            {compInactive
                                                                 ? <XCircle className="w-4 h-4 text-red-500" />
                                                                 : <CheckCircle className="w-4 h-4 text-green-600" />}
                                                            <span className="text-xs text-gray-500">{comp.capacities?.length || 0} capacidades</span>
                                                       </div>
                                                       <h4 className="font-semibold text-gray-800">{comp.name}</h4>
                                                       <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                                                  </div>
                                                  <div className="flex gap-1">
                                                       {!compInactive && (
                                                            <>
                                                                 <button onClick={() => handleAddCapacity(comp)} title="Agregar capacidad" className="w-7 h-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                                                                      <Plus className="w-4 h-4" />
                                                                 </button>
                                                                 <button onClick={() => { setEditingCompetency(comp); setShowCompetencyForm(true); }} title="Editar" className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                                                      <Edit2 className="w-4 h-4" />
                                                                 </button>
                                                                 <button onClick={() => handleDeleteCompetency(comp.id)} title="Eliminar" className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </button>
                                                            </>
                                                       )}
                                                       {}
                                                       {compInactive && (
                                                            <button onClick={() => handleRestoreCompetency(comp.id)} title="Restaurar" className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">
                                                                 <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>

                                        {}
                                        {expandedCompetencies.has(comp.id) && (
                                             <div className="p-4 pl-12 space-y-2 bg-gray-50">
                                                  {comp.capacities?.length === 0 ? (
                                                       <p className="text-sm text-gray-500">No hay capacidades</p>
                                                  ) : (
                                                       comp.capacities?.map((cap) => {
                                                            const capInactive = isInactive(cap.id, cap.status);
                                                            return (
                                                                 <div key={cap.id} className={`border border-gray-200 rounded-lg bg-white ${capInactive ? "opacity-60" : ""}`}>
                                                                      <div className="p-3 bg-green-50 rounded-t-lg">
                                                                           <div className="flex items-start gap-3">
                                                                                <button onClick={() => toggleCapacity(cap.id)} className="mt-1 text-green-600 hover:text-green-700">
                                                                                     {expandedCapacities.has(cap.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                                </button>
                                                                                <div className="flex-1">
                                                                                     <div className="flex items-center gap-2 mb-1">
                                                                                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">{cap.code}</span>
                                                                                          {capInactive
                                                                                               ? <XCircle className="w-3 h-3 text-red-500" />
                                                                                               : <CheckCircle className="w-3 h-3 text-green-600" />}
                                                                                          <span className="text-xs text-gray-500">{cap.performances?.length || 0} desempeños</span>
                                                                                     </div>
                                                                                     <h5 className="font-semibold text-gray-800 text-sm">{cap.name}</h5>
                                                                                     <p className="text-xs text-gray-600 mt-1">{cap.description}</p>
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                     {!capInactive && (
                                                                                          <>
                                                                                               <button onClick={() => handleAddPerformance(cap)} title="Agregar desempeño" className="w-6 h-6 flex items-center justify-center rounded-lg text-purple-600 hover:bg-purple-50 transition-colors">
                                                                                                    <Plus className="w-3.5 h-3.5" />
                                                                                               </button>
                                                                                               <button onClick={() => { setEditingCapacity(cap); setSelectedCompetencyForCapacity(comp); setShowCapacityForm(true); }} title="Editar" className="w-6 h-6 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                                               </button>
                                                                                               <button onClick={() => handleDeleteCapacity(cap.id)} title="Eliminar" className="w-6 h-6 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                               </button>
                                                                                          </>
                                                                                     )}
                                                                                     {}
                                                                                     {capInactive && (
                                                                                          <button onClick={() => handleRestoreCapacity(cap.id)} title="Restaurar" className="w-6 h-6 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">
                                                                                               <RotateCcw className="w-3.5 h-3.5" />
                                                                                          </button>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      </div>

                                                                      {}
                                                                      {expandedCapacities.has(cap.id) && (
                                                                           <div className="p-3 pl-10 space-y-2 bg-gray-50">
                                                                                {cap.performances?.length === 0 ? (
                                                                                     <p className="text-xs text-gray-500">No hay desempeños</p>
                                                                                ) : (
                                                                                     cap.performances?.map((perf) => {
                                                                                          const perfInactive = isInactive(perf.id, perf.status);
                                                                                          return (
                                                                                               <div key={perf.id} className={`p-2 bg-purple-50 border border-purple-200 rounded ${perfInactive ? "opacity-60" : ""}`}>
                                                                                                    <div className="flex items-start gap-2">
                                                                                                         <div className="flex-1">
                                                                                                              <div className="flex items-center gap-2 mb-1">
                                                                                                                   <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded font-semibold">{perf.code}</span>
                                                                                                                   {perfInactive
                                                                                                                        ? <XCircle className="w-3 h-3 text-red-500" />
                                                                                                                        : <CheckCircle className="w-3 h-3 text-green-600" />}
                                                                                                              </div>
                                                                                                              <p className="text-xs text-gray-700">{perf.description}</p>
                                                                                                         </div>
                                                                                                         <div className="flex gap-1">
                                                                                                              {!perfInactive && (
                                                                                                                   <>
                                                                                                                        <button onClick={() => { setEditingPerformance(perf); setSelectedCapacityForPerformance(cap); setShowPerformanceForm(true); }} title="Editar" className="w-6 h-6 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                                                                                                             <Edit2 className="w-3 h-3" />
                                                                                                                        </button>
                                                                                                                        <button onClick={() => handleDeletePerformance(perf.id)} title="Eliminar" className="w-6 h-6 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                                                                                             <Trash2 className="w-3 h-3" />
                                                                                                                        </button>
                                                                                                                   </>
                                                                                                              )}
                                                                                                              {}
                                                                                                              {perfInactive && (
                                                                                                                   <button onClick={() => handleRestorePerformance(perf.id)} title="Restaurar" className="w-6 h-6 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">
                                                                                                                        <RotateCcw className="w-3 h-3" />
                                                                                                                   </button>
                                                                                                              )}
                                                                                                         </div>
                                                                                                    </div>
                                                                                               </div>
                                                                                          );
                                                                                     })
                                                                                )}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                            );
                                                       })
                                                  )}
                                             </div>
                                        )}
                                   </div>
                              );
                         })}
                    </div>
               )}
          </div>
     );
}