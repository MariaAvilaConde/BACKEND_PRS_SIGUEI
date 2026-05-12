import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEnrollments } from "../hooks/useEnrollments";
import { useEnrollmentValidation } from "../hooks/useEnrollmentValidation";
import { IntegratedEnrollmentForm } from "../components/enrollment-forms/IntegratedEnrollmentForm";
import { EnrollmentValidation } from "../components/enrollment-forms/EnrollmentValidation";
import { formatEnrollmentForApi } from "../models/enrollmentModel";

/**
 * Página para crear una nueva matrícula
 */
export default function EnrollmentCreatePage() {
  const navigate = useNavigate();
  const { createEnrollment } = useEnrollments();
  const { validationErrors, validateEnrollmentData } = useEnrollmentValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (enrollmentData) => {
    setIsSubmitting(true);

    try {
      // Validar datos
      const isValid = await validateEnrollmentData(enrollmentData);
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      // Formatear datos para la API
      const payload = formatEnrollmentForApi(enrollmentData);

      // Crear matrícula
      await createEnrollment(payload);

      // Navegar a la lista
      navigate("/secretaria/matriculas");
    } catch (error) {
      console.error("Error al crear matrícula:", error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/secretaria/matriculas");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver a la lista
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Matrícula</h1>
            <p className="text-gray-600">
              Complete toda la información requerida para registrar una nueva matrícula
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Campos obligatorios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Información académica</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Documentos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Errores de validación */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mb-6">
            <EnrollmentValidation validationErrors={validationErrors} />
          </div>
        )}

        {/* Formulario Integrado */}
        <IntegratedEnrollmentForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
