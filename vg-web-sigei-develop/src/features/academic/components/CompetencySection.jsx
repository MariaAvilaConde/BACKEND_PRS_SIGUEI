import { useState } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { competencyService } from "../services/academicService";
import { createEmptyCompetency } from "../models/academicModel";
import CompetencyForm from "./CompetencyForm";

export default function CompetencySection({ course, competencies, loading, onRefresh, onSelectCompetency }) {
     const { user } = useAuth();
     const [showForm, setShowForm] = useState(false);
     const [editingCompetency, setEditingCompetency] = useState(null);
     const [saving, setSaving] = useState(false);

     const handleAdd = () => {
          const newComp = createEmptyCompetency();
          newComp.courseId = course.id;
          newComp.institutionId = user.institutionId;
          setEditingCompetency(newComp);
          setShowForm(true);
     };

     const handleEdit = (competency) => {
          setEditingCompetency(competency);
          setShowForm(true);
     };

     const handleSave = async (formData) => {
          try {
               setSaving(true);
               if (formData.id && formData.id.trim() !== "") {
                    await competencyService.update(formData.id, formData);
               } else {
                    await competencyService.create(formData);
               }
               setShowForm(false);
               setEditingCompetency(null);
               onRefresh();
          } catch (error) {
               console.error("Error al guardar competencia:", error);
               alert("Error al guardar la competencia");
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (id) => {
          if (!confirm("¿Estás seguro de eliminar esta competencia?")) return;
          
          try {
               await competencyService.delete(id);
               onRefresh();
          } catch (error) {
               console.error("Error al eliminar competencia:", error);
               alert("Error al eliminar la competencia");
          }
     };

     if (loading) {
          return <div className="text-center py-8">Cargando competencias...</div>;
     }

     return (
          <div>
               <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                         Competencias del Curso
                    </h3>
                    <button
                         onClick={handleAdd}
                         className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                         + Agregar Competencia
                    </button>
               </div>

               {showForm && (
                    <CompetencyForm
                         competency={editingCompetency}
                         onSave={handleSave}
                         onCancel={() => {
                              setShowForm(false);
                              setEditingCompetency(null);
                         }}
                         saving={saving}
                    />
               )}

               {competencies.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                         <p className="text-gray-500">No hay competencias registradas</p>
                    </div>
               ) : (
                    <div className="space-y-3">
                         {competencies.map((comp) => (
                              <div
                                   key={comp.id}
                                   className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                              >
                                   <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-2">
                                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                       {comp.code}
                                                  </span>
                                                  <span className="text-xs text-gray-400">
                                                       Orden: {comp.orderIndex}
                                                  </span>
                                             </div>
                                             <h4 className="font-semibold text-gray-800 mb-1">
                                                  {comp.name}
                                             </h4>
                                             <p className="text-sm text-gray-600">
                                                  {comp.description}
                                             </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                             <button
                                                  onClick={() => handleEdit(comp)}
                                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                             >
                                                  Editar
                                             </button>
                                             <button
                                                  onClick={() => onSelectCompetency(comp)}
                                                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                                             >
                                                  Capacidades →
                                             </button>
                                             <button
                                                  onClick={() => handleDelete(comp.id)}
                                                  className="text-red-600 hover:text-red-700 text-sm"
                                             >
                                                  Eliminar
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
}
