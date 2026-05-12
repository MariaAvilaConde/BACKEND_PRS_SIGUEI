import { useState } from "react";
import { Target, Save, Loader2 } from "lucide-react";

export default function CapacityForm({ capacity, onSave, onCancel, saving }) {
     const [formData, setFormData] = useState(capacity);

     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: name === "orderIndex" ? parseInt(value) || 1 : value
          }));
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          onSave(formData);
     };

     const isEditing = !!(formData.id && formData.id.trim() !== "");

     return (
          <form onSubmit={handleSubmit} className="space-y-5">

               {}
               <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                         <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                         <h4 className="text-lg font-bold text-gray-900">
                              {isEditing ? "Editar Capacidad" : "Nueva Capacidad"}
                         </h4>
                         <p className="text-xs text-gray-400">Completa los campos requeridos</p>
                    </div>
               </div>

               {}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Código <span className="text-red-400">*</span>
                         </label>
                         <input
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={handleChange}
                              required
                              placeholder="Ej: CAP-001"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                         />
                    </div>

                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Orden
                         </label>
                         <input
                              type="number"
                              name="orderIndex"
                              value={formData.orderIndex}
                              onChange={handleChange}
                              min="1"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                         />
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Nombre <span className="text-red-400">*</span>
                         </label>
                         <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              placeholder="Nombre de la capacidad"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                         />
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Descripción <span className="text-red-400">*</span>
                         </label>
                         <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              required
                              rows={3}
                              placeholder="Descripción de la capacidad"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
                         />
                    </div>
               </div>

               {}
               <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                         type="button"
                         onClick={onCancel}
                         disabled={saving}
                         className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                         Cancelar
                    </button>
                    <button
                         type="submit"
                         disabled={saving}
                         className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium shadow-sm disabled:opacity-60"
                    >
                         {saving
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Save className="w-4 h-4" />}
                         {isEditing ? "Guardar cambios" : "Crear capacidad"}
                    </button>
               </div>
          </form>
     );
}