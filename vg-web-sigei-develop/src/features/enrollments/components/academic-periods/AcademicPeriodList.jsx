import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Edit, Trash2, CheckCircle, Eye, Calendar, Clock, Users } from "lucide-react";
import { PERIOD_STATUS_LABELS, getEnrollmentPeriodStatus } from "../../models/academicPeriodModel";

/**
 * Lista de períodos académicos con acciones
 */
export function AcademicPeriodList({
  periods,
  onEdit,
  onDelete,
  onActivate,
  onClose,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Filtrar períodos
  const filteredPeriods = useMemo(() => {
    return periods.filter((period) => {
      // Filtro de búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const periodName = period.periodName?.toLowerCase() || "";
        const academicYear = period.academicYear?.toLowerCase() || "";
        if (!periodName.includes(term) && !academicYear.includes(term)) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter && period.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [periods, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Cargando períodos académicos...</p>
        </div>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay períodos académicos</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo período académico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o año académico..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Filtro de estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="">Todos los estados</option>
              {Object.entries(PERIOD_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Users size={16} />
          <span>Mostrando {filteredPeriods.length} de {periods.length} períodos</span>
        </div>
      </div>

      {/* Lista de períodos */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPeriods.map((period) => {
          const enrollmentStatus = getEnrollmentPeriodStatus(period);
          const isExpanded = selectedPeriod === period.id;
          
          return (
            <div
              key={period.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Header del Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="flex-shrink-0" size={24} />
                      <h3 className="text-xl font-bold">{period.periodName}</h3>
                    </div>
                    <p className="text-blue-100 text-sm font-medium">Año Académico {period.academicYear}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getStatusBadgeClass(
                        period.status
                      )}`}
                    >
                      {PERIOD_STATUS_LABELS[period.status] || period.status}
                    </span>
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getEnrollmentStatusBadgeClass(
                        enrollmentStatus
                      )}`}
                    >
                      {getEnrollmentStatusLabel(enrollmentStatus)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenido del Card */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Período Académico */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={18} className="text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Período Académico</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-500" />
                        <span className="text-gray-600">Inicio:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(period.startDate).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-500" />
                        <span className="text-gray-600">Fin:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(period.endDate).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Período de Matrícula */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={18} className="text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Período de Matrícula</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-500" />
                        <span className="text-gray-600">Inicio:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(period.enrollmentPeriodStart).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-500" />
                        <span className="text-gray-600">Fin:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(period.enrollmentPeriodEnd).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matrícula Tardía (si aplica) */}
                {period.allowLateEnrollment && period.lateEnrollmentEndDate && (
                  <div className="mt-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={18} className="text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Matrícula Tardía</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Disponible hasta el{" "}
                      <span className="font-bold text-orange-700">
                        {new Date(period.lateEnrollmentEndDate).toLocaleDateString("es-PE", { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </p>
                  </div>
                )}

                {/* Detalles expandibles */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">ID del Período:</span> {period.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Institución:</span> {period.institutionId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Creado:</span>{" "}
                          {period.createdAt ? new Date(period.createdAt).toLocaleDateString("es-PE") : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Actualizado:</span>{" "}
                          {period.updatedAt ? new Date(period.updatedAt).toLocaleDateString("es-PE") : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer con Acciones */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPeriod(isExpanded ? null : period.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(period)}
                      className="p-2.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>

                    {period.status !== "ACTIVE" && (
                      <button
                        onClick={() => onActivate(period.id)}
                        className="p-2.5 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
                        title="Activar"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(period.id)}
                      className="p-2.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje cuando no hay resultados filtrados */}
      {filteredPeriods.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 font-medium">No se encontraron períodos con los filtros aplicados.</p>
          <p className="text-gray-400 text-sm mt-1">Intenta ajustar los criterios de búsqueda</p>
        </div>
      )}
    </div>
  );
}

AcademicPeriodList.propTypes = {
  periods: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onActivate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

/**
 * Obtiene las clases CSS para el badge de estado
 */
function getStatusBadgeClass(status) {
  const classes = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

/**
 * Obtiene las clases CSS para el badge de estado de matrícula
 */
function getEnrollmentStatusBadgeClass(status) {
  const classes = {
    open: "bg-blue-100 text-blue-800",
    late: "bg-orange-100 text-orange-800",
    closed: "bg-gray-100 text-gray-800",
    upcoming: "bg-purple-100 text-purple-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

/**
 * Obtiene la etiqueta para el estado de matrícula
 */
function getEnrollmentStatusLabel(status) {
  const labels = {
    open: "Matrícula Abierta",
    late: "Matrícula Tardía",
    closed: "Matrícula Cerrada",
    upcoming: "Próximamente",
  };
  return labels[status] || status;
}
