import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createEmptyAcademicPeriod, PERIOD_STATUS, validateAcademicPeriod } from "../../models/academicPeriodModel";
import { InstitutionSelector } from "../shared/InstitutionSelector";

/**
 * Formulario para crear/editar períodos académicos
 */
export function AcademicPeriodForm({ period, onSubmit, onCancel, isLoading = false }) {
  const [formData, setFormData] = useState(period || createEmptyAcademicPeriod());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (period) {
      setFormData(period);
    }
  }, [period]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Datos del formulario antes de validar:", formData);

    // Validar
    const validation = validateAcademicPeriod(formData);
    console.log("Resultado de validación:", validation);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      console.log("Errores de validación:", validation.errors);
      return;
    }

    console.log("Formulario válido, enviando datos...");
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institución <span className="text-red-500">*</span>
            </label>
            <InstitutionSelector
              value={formData.institutionId}
              onChange={(value) => handleChange("institutionId", value)}
              disabled={isLoading}
            />
            {errors.institutionId && <p className="mt-1 text-sm text-red-600">{errors.institutionId}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año Académico <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => handleChange("academicYear", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                placeholder="2025"
              />
              {errors.academicYear && <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Período <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.periodName}
                onChange={(e) => handleChange("periodName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                placeholder="Primer Bimestre"
              />
              {errors.periodName && <p className="mt-1 text-sm text-red-600">{errors.periodName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value={PERIOD_STATUS.PENDING}>Pendiente</option>
              <option value={PERIOD_STATUS.ACTIVE}>Activo</option>
              <option value={PERIOD_STATUS.INACTIVE}>Inactivo</option>
              <option value={PERIOD_STATUS.CLOSED}>Cerrado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fechas del Período */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas del Período Académico</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
          </div>
        </div>
      </div>

      {/* Fechas de Matrícula */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Período de Matrícula</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inicio de Matrícula <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.enrollmentPeriodStart}
              onChange={(e) => handleChange("enrollmentPeriodStart", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.enrollmentPeriodStart && (
              <p className="mt-1 text-sm text-red-600">{errors.enrollmentPeriodStart}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fin de Matrícula <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.enrollmentPeriodEnd}
              onChange={(e) => handleChange("enrollmentPeriodEnd", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.enrollmentPeriodEnd && (
              <p className="mt-1 text-sm text-red-600">{errors.enrollmentPeriodEnd}</p>
            )}
          </div>
        </div>

        {/* Matrícula Tardía */}
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allowLateEnrollment}
              onChange={(e) => handleChange("allowLateEnrollment", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">Permitir matrícula tardía</span>
          </label>
        </div>

        {formData.allowLateEnrollment && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fin de Matrícula Tardía <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.lateEnrollmentEndDate}
              onChange={(e) => handleChange("lateEnrollmentEndDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.lateEnrollmentEndDate && (
              <p className="mt-1 text-sm text-red-600">{errors.lateEnrollmentEndDate}</p>
            )}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Guardando..." : period?.id ? "Actualizar" : "Crear"} Período
        </button>
      </div>
    </form>
  );
}

AcademicPeriodForm.propTypes = {
  period: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
