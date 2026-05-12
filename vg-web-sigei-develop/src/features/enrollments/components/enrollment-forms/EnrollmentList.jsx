import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Eye, Edit, Trash2, CheckCircle, Clock } from "lucide-react";
import { ENROLLMENT_STATUS_LABELS } from "../../models/enrollmentModel";
import { ExportEnrollmentDetailButton } from "../shared/EnrollmentReportButton";

/**
 * Lista de enrollments con filtros y acciones
 */
export function EnrollmentList({ enrollments, onEdit, onDelete, onView, onActivate, onSetPending, isLoading = false, institution = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [activatingIds, setActivatingIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());

  // Filtrar enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      // Filtro de búsqueda - buscar en nombre de estudiante, ID, documento y código
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const studentId = enrollment.studentId?.toLowerCase() || "";
        const studentName = enrollment.studentFullName?.toLowerCase() || "";
        const studentDoc = enrollment.studentDocumentNumber?.toLowerCase() || "";
        const enrollmentCode = enrollment.enrollmentCode?.toLowerCase() || "";
        const institutionName = enrollment.institutionName?.toLowerCase() || "";
        
        const matches = studentId.includes(term) || 
                       studentName.includes(term) || 
                       studentDoc.includes(term) ||
                       enrollmentCode.includes(term) ||
                       institutionName.includes(term);
        
        if (!matches) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter && enrollment.enrollmentStatus !== statusFilter) {
        return false;
      }

      // Filtro de año
      if (yearFilter && enrollment.academicYear !== yearFilter) {
        return false;
      }

      return true;
    });
  }, [enrollments, searchTerm, statusFilter, yearFilter]);

  // Obtener años únicos para el filtro
  const uniqueYears = useMemo(() => {
    const years = [...new Set(enrollments.map((e) => e.academicYear))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [enrollments]);

  const handleDelete = async (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    try {
      await onDelete(id);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleActivate = async (id) => {
    setActivatingIds(prev => new Set([...prev, id]));
    try {
      await onActivate(id);
    } finally {
      setActivatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleSetPending = async (id) => {
    setPendingIds(prev => new Set([...prev, id]));
    try {
      await onSetPending(id);
    } finally {
      setPendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

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
          <p className="text-gray-600">Cargando matrículas...</p>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay matrículas</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva matrícula.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, DNI, código de matrícula..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los años</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-3 text-sm text-gray-600">
          Mostrando {filteredEnrollments.length} de {enrollments.length} matrículas
        </div>
      </div>

      {/* Tabla de enrollments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {enrollment.enrollmentCode || enrollment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{enrollment.studentFullName || enrollment.studentId}</p>
                      {enrollment.studentDocumentNumber && (
                        <p className="text-xs text-gray-500">DNI: {enrollment.studentDocumentNumber}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p className="font-medium">{enrollment.institutionName || enrollment.institutionId}</p>
                      {enrollment.institutionCode && (
                        <p className="text-xs text-gray-500">{enrollment.institutionCode}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p className="font-medium">{enrollment.classroomName || enrollment.classroomId}</p>
                      {enrollment.classroomGrade && (
                        <p className="text-xs text-gray-500">Grado: {enrollment.classroomGrade}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enrollment.shift}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        enrollment.enrollmentStatus
                      )}`}
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus] || enrollment.enrollmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(enrollment.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(enrollment.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      {/* Botón de activar solo para matrículas PENDING */}
                      {enrollment.enrollmentStatus === "PENDING" && (
                        <button
                          onClick={() => handleActivate(enrollment.id)}
                          disabled={activatingIds.has(enrollment.id)}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title="Activar matrícula"
                        >
                          {activatingIds.has(enrollment.id) ? (
                            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>
                      )}
                      {/* Botón de cambiar a pendiente solo para matrículas INACTIVE */}
                      {enrollment.enrollmentStatus === "INACTIVE" && (
                        <button
                          onClick={() => handleSetPending(enrollment.id)}
                          disabled={pendingIds.has(enrollment.id)}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title="Cambiar a pendiente"
                        >
                          {pendingIds.has(enrollment.id) ? (
                            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Clock size={16} />
                          )}
                        </button>
                      )}
                      <ExportEnrollmentDetailButton
                        enrollment={enrollment}
                        student={enrollment.student}
                        institution={institution}
                        classroom={enrollment.classroom}
                        academicPeriod={enrollment.academicPeriod}
                        iconOnly={true}
                      />
                      {/* Botón de eliminar solo para matrículas que NO sean INACTIVE */}
                      {enrollment.enrollmentStatus !== "INACTIVE" && (
                        <button
                          onClick={() => handleDelete(enrollment.id)}
                          disabled={deletingIds.has(enrollment.id)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title="Eliminar"
                        >
                          {deletingIds.has(enrollment.id) ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay resultados filtrados */}
        {filteredEnrollments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron matrículas con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}

EnrollmentList.propTypes = {
  enrollments: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onActivate: PropTypes.func.isRequired,
  onSetPending: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  institution: PropTypes.object,
};

/**
 * Obtiene las clases CSS para el badge de estado
 */
function getStatusBadgeClass(status) {
  const classes = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}
