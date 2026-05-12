import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useEnrollments } from "../hooks/useEnrollments";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { EnrollmentList } from "../components/enrollment-forms/EnrollmentList";
import { ExportEnrollmentsButton } from "../components/shared/EnrollmentReportButton";

/**
 * Página principal de lista de matrículas
 */
export default function EnrollmentsListPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { enrollments, loading, fetchAll, fetchByInstitution, deleteEnrollment, activateEnrollment, setPendingEnrollment } = useEnrollments();
  const [institution, setInstitution] = useState(null);
  const [loadingInstitution, setLoadingInstitution] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Evitar llamadas duplicadas
    if (!hasFetched.current) {
      hasFetched.current = true;
      if (user?.institutionId) {
        fetchByInstitution(user.institutionId);
        loadInstitution(user.institutionId);
      } else {
        fetchAll();
      }
    }
  }, [fetchAll, fetchByInstitution, user?.institutionId]);

  const loadInstitution = async (institutionId) => {
    setLoadingInstitution(true);
    try {
      console.log("🏫 Cargando información completa de la institución:", institutionId);
      const response = await institutionService.getById(institutionId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      console.log("✅ Institución cargada para reportes:", data);
      console.log("🖼️ Logo URL:", data?.logoUrl);
      console.log("🎨 Color institucional:", data?.colorInstitution);
      setInstitution(data);
    } catch (error) {
      console.error("❌ Error al cargar institución:", error);
      // Usar datos por defecto si falla
      setInstitution({ 
        name: "Sistema SIGEI",
        logoUrl: null,
        colorInstitution: null
      });
    } finally {
      setLoadingInstitution(false);
    }
  };

  const handleCreate = () => {
    navigate("/secretaria/matriculas/create");
  };

  const handleEdit = (id) => {
    navigate(`/secretaria/matriculas/${id}/edit`);
  };

  const handleView = (id) => {
    navigate(`/secretaria/matriculas/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteEnrollment(id);
      if (result === true) {
        // Solo recargar si la eliminación fue exitosa
        fetchAll();
      }
      // Si result es false o null, no hacer nada (el error ya se mostró)
    } catch (error) {
      console.error("Error inesperado al eliminar:", error);
      // El error ya se maneja en el hook, pero por si acaso
    }
  };

  const handleActivate = async (id) => {
    try {
      const result = await activateEnrollment(id);
      if (result === true) {
        // Recargar la lista para mostrar el estado actualizado
        fetchAll();
      }
    } catch (error) {
      console.error("Error inesperado al activar:", error);
    }
  };

  const handleSetPending = async (id) => {
    try {
      const result = await setPendingEnrollment(id);
      if (result === true) {
        // Recargar la lista para mostrar el estado actualizado
        fetchAll();
      }
    } catch (error) {
      console.error("Error inesperado al cambiar a pendiente:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matrículas</h1>
          <p className="text-gray-600 mt-1">Gestiona las matrículas de estudiantes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botón de exportar PDF */}
          {enrollments.length > 0 && institution && (
            <ExportEnrollmentsButton
              enrollments={enrollments}
              institution={institution}
              filters={{}}
              className="text-sm"
            />
          )}
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nueva Matrícula
          </button>
        </div>
      </div>

      {/* Lista de matrículas */}
      <EnrollmentList
        enrollments={enrollments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onActivate={handleActivate}
        onSetPending={handleSetPending}
        isLoading={loading}
        institution={institution}
      />
    </div>
  );
}
