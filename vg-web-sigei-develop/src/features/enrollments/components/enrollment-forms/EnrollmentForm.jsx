import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { EnhancedStudentSelector } from "../shared/EnhancedStudentSelector";
import { InstitutionSelector } from "../shared/InstitutionSelector";
import { UserInstitutionInfo } from "../shared/UserInstitutionInfo";
import { ClassroomSelector } from "../shared/ClassroomSelector";
import { AcademicPeriodSelector } from "../shared/AcademicPeriodSelector";
import { useEnrollmentValidation } from "../../hooks/useEnrollmentValidation";
import { useInstitutionSchedules } from "../../hooks/useInstitutionSchedules";
import { createEmptyEnrollment, ENROLLMENT_STATUS, ENROLLMENT_TYPE } from "../../models/enrollmentModel";
import { useAuth } from "@/core/auth/AuthContext";

/**
 * Formulario para crear/editar enrollments
 */
export function EnrollmentForm({ enrollment, onSubmit, onCancel, isLoading = false, hideButtons = false, onFormDataChange }) {
  const { user } = useAuth(); // Obtener usuario autenticado
  const [formData, setFormData] = useState(enrollment || createEmptyEnrollment(user?.institutionId));
  const { validationErrors, validateBasicFields, clearFieldError } = useEnrollmentValidation();
  
  // Obtener horarios de la institución
  const { schedules } = useInstitutionSchedules(formData.institutionId);

  // Determinar si el usuario tiene institución asignada Y estamos creando (no editando)
  const hasUserInstitution = user?.institutionId && !enrollment?.id;
  
  // Para edición, siempre mostrar la institución de la matrícula, no la del usuario
  const isEditing = enrollment?.id;
  const shouldShowInstitutionSelector = !hasUserInstitution || isEditing;

  useEffect(() => {
    if (enrollment) {
      setFormData(enrollment);
    } else if (hasUserInstitution) {
      // Si el usuario tiene institución asignada, crear enrollment con esa institución
      const newFormData = createEmptyEnrollment(user.institutionId);
      setFormData(newFormData);
      // Notificar al componente padre sobre los datos iniciales
      if (onFormDataChange) {
        onFormDataChange(newFormData);
      }
    }
  }, [enrollment, hasUserInstitution, user?.institutionId, onFormDataChange]);

  const handleChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    clearFieldError(field);
    
    // Notificar al componente padre sobre los cambios
    if (onFormDataChange) {
      onFormDataChange(updatedData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos básicos (skip institution validation solo si estamos creando Y el usuario tiene institución asignada)
    const skipInstitutionValidation = hasUserInstitution && !isEditing;
    const isValid = validateBasicFields(formData, skipInstitutionValidation);
    if (!isValid) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">


      {/* Información del Estudiante */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Estudiante</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estudiante <span className="text-red-500">*</span>
            </label>
            <EnhancedStudentSelector
              value={formData.studentId}
              onChange={(value) => handleChange("studentId", value)}
              institutionId={formData.institutionId}
              disabled={isLoading}
            />
            {validationErrors.studentId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.studentId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad del Estudiante
              </label>
              <input
                type="number"
                value={formData.studentAge || ""}
                onChange={(e) => handleChange("studentAge", parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                min="3"
                max="18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo de Edad <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.ageGroup}
                onChange={(e) => handleChange("ageGroup", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Seleccione grupo de edad</option>
                <option value="3 años">3 años</option>
                <option value="4 años">4 años</option>
                <option value="5 años">5 años</option>
              </select>
              {validationErrors.ageGroup && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.ageGroup}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información de la Institución */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Institución</h3>

        <div className="space-y-4">
          {/* Mostrar selector de institución si estamos editando O si el usuario no tiene institución asignada */}
          {shouldShowInstitutionSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institución <span className="text-red-500">*</span>
              </label>
              <InstitutionSelector
                value={formData.institutionId}
                onChange={(value) => handleChange("institutionId", value)}
                disabled={isLoading || (isEditing && formData.institutionId)} // Deshabilitar en edición si ya tiene institución
              />
              {validationErrors.institutionId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.institutionId}</p>
              )}
              {isEditing && formData.institutionId && (
                <p className="mt-1 text-xs text-blue-600">
                  💡 En modo edición - La institución se puede cambiar si es necesario
                </p>
              )}
            </div>
          )}

          {/* Mostrar información de la institución del usuario solo si estamos creando Y el usuario tiene institución */}
          {hasUserInstitution && !isEditing && (
            <UserInstitutionInfo institutionId={user.institutionId} />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aula <span className="text-red-500">*</span>
            </label>
            <ClassroomSelector
              value={formData.classroomId}
              onChange={(value) => handleChange("classroomId", value)}
              institutionId={formData.institutionId}
              disabled={isLoading}
            />
            {validationErrors.classroomId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.classroomId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información Académica */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Académica</h3>

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
            {validationErrors.academicYear && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.academicYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período Académico <span className="text-red-500">*</span>
            </label>
            <AcademicPeriodSelector
              value={formData.academicPeriodId}
              onChange={(value) => handleChange("academicPeriodId", value)}
              institutionId={formData.institutionId}
              disabled={isLoading}
            />
            {validationErrors.academicPeriodId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.academicPeriodId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turno <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.shift}
              onChange={(e) => handleChange("shift", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Seleccione un turno</option>
              {schedules.length > 0 ? (
                schedules.map((schedule, index) => (
                  <option key={index} value={schedule.shift}>
                    {schedule.shift} ({schedule.startTime} - {schedule.endTime})
                  </option>
                ))
              ) : (
                <>
                  <option value="MAÑANA">Mañana</option>
                  <option value="TARDE">Tarde</option>
                </>
              )}
            </select>
            {validationErrors.shift && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.shift}</p>
            )}

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sección <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => handleChange("section", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              placeholder="A, B, C..."
              maxLength="1"
            />
            {validationErrors.section && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.section}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalidad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.modality}
              onChange={(e) => handleChange("modality", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Seleccione una modalidad</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HIBRIDA">Híbrida</option>
            </select>
            {validationErrors.modality && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.modality}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.enrollmentStatus}
              onChange={(e) => handleChange("enrollmentStatus", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value={ENROLLMENT_STATUS.PENDING}>Pendiente</option>
              <option value={ENROLLMENT_STATUS.ACTIVE}>Activo</option>
              <option value={ENROLLMENT_STATUS.INACTIVE}>Inactivo</option>
              <option value={ENROLLMENT_STATUS.CANCELLED}>Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Matrícula
            </label>
            <select
              value={formData.enrollmentType}
              onChange={(e) => handleChange("enrollmentType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value={ENROLLMENT_TYPE.NUEVA}>Nueva</option>
              <option value={ENROLLMENT_TYPE.REINSCRIPCION}>Reinscripción</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={formData.observations}
            onChange={(e) => handleChange("observations", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            placeholder="Observaciones adicionales..."
          />
        </div>
      </div>

      {/* Botones de acción */}
      {!hideButtons && (
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
            {isLoading ? "Guardando..." : enrollment?.id ? "Actualizar" : "Crear"} Matrícula
          </button>
        </div>
      )}
    </form>
  );
}

EnrollmentForm.propTypes = {
  enrollment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  hideButtons: PropTypes.bool,
  onFormDataChange: PropTypes.func, // Callback para notificar cambios al padre
};
