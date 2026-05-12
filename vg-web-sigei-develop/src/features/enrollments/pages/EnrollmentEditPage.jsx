import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEnrollments } from "../hooks/useEnrollments";
import { useEnrollmentValidation } from "../hooks/useEnrollmentValidation";
import { IntegratedEnrollmentForm } from "../components/enrollment-forms/IntegratedEnrollmentForm";
import { EnrollmentValidation } from "../components/enrollment-forms/EnrollmentValidation";
import { formatEnrollmentUpdateForApi, parseEnrollmentFromApi } from "../models/enrollmentModel";

/**
 * Página para editar una matrícula existente
 */
export default function EnrollmentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchById, updateEnrollment } = useEnrollments();
  const { validationErrors, validateEnrollmentData } = useEnrollmentValidation();
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEnrollment();
  }, [id]);

  const loadEnrollment = async () => {
    setIsLoading(true);
    try {
      const data = await fetchById(id);
      const parsedEnrollment = parseEnrollmentFromApi(data);
      setEnrollment(parsedEnrollment);
    } catch (error) {
      console.error("Error al cargar matrícula:", error);
      navigate("/secretaria/matriculas");
    } finally {
      setIsLoading(false);
    }
  };

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
      const payload = formatEnrollmentUpdateForApi(enrollmentData);

      // Actualizar matrícula
      await updateEnrollment(id, payload);

      // Navegar a la lista
      navigate("/secretaria/matriculas");
    } catch (error) {
      console.error("Error al actualizar matrícula:", error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/secretaria/matriculas");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
            <p className="text-gray-600">Cargando matrícula...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">No se encontró la matrícula</p>
          <button
            onClick={() => navigate("/enrollments")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver a la lista
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Matrícula</h1>
        <p className="text-gray-600 mt-1">
          Código: {enrollment.enrollmentCode || enrollment.id}
        </p>
      </div>

      {/* Errores de validación */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-6">
          <EnrollmentValidation validationErrors={validationErrors} />
        </div>
      )}

      {/* Formulario */}
      <IntegratedEnrollmentForm
        enrollment={enrollment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  );
}
