import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Calendar, CheckCircle } from "lucide-react";
import { useAcademicPeriods } from "../../hooks/useAcademicPeriods";

/**
 * Selector de períodos académicos
 */
export function AcademicPeriodSelector({ value, onChange, institutionId, disabled = false }) {
  const { periods, loading, error, fetchAll, fetchByInstitution } = useAcademicPeriods();

  useEffect(() => {
    if (institutionId) {
      fetchByInstitution(institutionId);
    } else {
      fetchAll();
    }
  }, [institutionId, fetchAll, fetchByInstitution]);

  const selectedPeriod = periods.find(period => period.id === value);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'PLANNED': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-gray-600 bg-gray-100';
      case 'CLOSED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Activo';
      case 'PLANNED': return 'Planificado';
      case 'COMPLETED': return 'Completado';
      case 'CLOSED': return 'Cerrado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
      >
        <option value="">
          {loading ? "Cargando períodos..." : 
           periods.length === 0 ? "No hay períodos disponibles" :
           "Seleccione un período académico"}
        </option>
        {periods.map((period) => (
          <option key={period.id} value={period.id}>
            {period.name || period.periodName} ({period.year || period.academicYear})
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {/* Mostrar información del período seleccionado */}
      {selectedPeriod && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {selectedPeriod.name || selectedPeriod.periodName}
                </p>
                {selectedPeriod.status && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(selectedPeriod.status)}`}>
                    {getStatusLabel(selectedPeriod.status)}
                  </span>
                )}
              </div>
              {selectedPeriod.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {selectedPeriod.description}
                </p>
              )}
              {(selectedPeriod.startDate || selectedPeriod.endDate) && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPeriod.startDate && `Desde: ${new Date(selectedPeriod.startDate).toLocaleDateString()}`}
                  {selectedPeriod.startDate && selectedPeriod.endDate && " • "}
                  {selectedPeriod.endDate && `Hasta: ${new Date(selectedPeriod.endDate).toLocaleDateString()}`}
                </p>
              )}
            </div>
            {selectedPeriod.status?.toUpperCase() === 'ACTIVE' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
      )}

      {error && error?.response?.status !== 404 && (
        <p className="mt-1 text-sm text-red-600">
          {error.message || "Error al cargar los períodos académicos"}
        </p>
      )}
    </div>
  );
}

AcademicPeriodSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  institutionId: PropTypes.string,
  disabled: PropTypes.bool,
};