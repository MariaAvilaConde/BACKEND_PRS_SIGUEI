import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, CheckCircle, Clock } from "lucide-react";
import { useEnrollments } from "../hooks/useEnrollments";
import { ExportEnrollmentDetailButton } from "../components/shared/EnrollmentReportButton";
import {
  parseEnrollmentFromApi,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS,
  calculateDocumentProgress,
} from "../models/enrollmentModel";

/**
 * Página de detalles de una matrícula
 */
export default function EnrollmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchById, deleteEnrollment, activateEnrollment, setPendingEnrollment } = useEnrollments();
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isSettingPending, setIsSettingPending] = useState(false);

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
      navigate("/enrollments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/enrollments/${id}/edit`);
  };

  const handleDelete = async () => {
    const result = await deleteEnrollment(id);
    if (result) {
      navigate("/enrollments");
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const result = await activateEnrollment(id);
      if (result) {
        // Recargar los datos de la matrícula para mostrar el nuevo estado
        loadEnrollment();
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleSetPending = async () => {
    setIsSettingPending(true);
    try {
      const result = await setPendingEnrollment(id);
      if (result) {
        // Recargar los datos de la matrícula para mostrar el nuevo estado
        loadEnrollment();
      }
    } finally {
      setIsSettingPending(false);
    }
  };

  const handleBack = () => {
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
          <button onClick={handleBack} className="mt-4 text-blue-600 hover:text-blue-800">
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  const documentProgress = calculateDocumentProgress(enrollment);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver a la lista
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalles de Matrícula</h1>
            <p className="text-gray-600 mt-1">
              Código: {enrollment.enrollmentCode || enrollment.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportEnrollmentDetailButton
              enrollment={enrollment}
              student={enrollment.student}
              institution={enrollment.institution}
              classroom={enrollment.classroom}
              academicPeriod={enrollment.academicPeriod}
              className="text-sm"
            />
            {/* Botón de activar solo para matrículas PENDING */}
            {enrollment.enrollmentStatus === "PENDING" && (
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Activando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Activar
                  </>
                )}
              </button>
            )}
            {/* Botón de cambiar a pendiente solo para matrículas INACTIVE */}
            {enrollment.enrollmentStatus === "INACTIVE" && (
              <button
                onClick={handleSetPending}
                disabled={isSettingPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettingPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Clock size={18} />
                    Cambiar a Pendiente
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit size={18} />
              Editar
            </button>
            {/* Botón de eliminar solo para matrículas que NO sean INACTIVE */}
            {enrollment.enrollmentStatus !== "INACTIVE" && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de Matrícula */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Matrícula</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                      enrollment.enrollmentStatus
                    )}`}
                  >
                    {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {ENROLLMENT_TYPE_LABELS[enrollment.enrollmentType]}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Matrícula</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {enrollment.enrollmentDate
                    ? new Date(enrollment.enrollmentDate).toLocaleDateString("es-PE")
                    : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Código</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.enrollmentCode || "Auto"}</dd>
              </div>
            </dl>
          </div>

          {/* Información Académica */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Académica</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Año Académico</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.academicYear}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Período Académico</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.academicPeriodId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Turno</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.shift}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sección</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.section}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Modalidad</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.modality}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Grupo de Edad</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.ageGroup}</dd>
              </div>
            </dl>
            {enrollment.observations && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Observaciones</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.observations}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información del Estudiante */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estudiante</h2>
            <dl className="space-y-3">
              {enrollment.studentFullName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{enrollment.studentFullName}</dd>
                </div>
              )}
              {enrollment.studentDocumentNumber && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Documento</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enrollment.studentDocumentNumber}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.studentId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Edad</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.studentAge || "N/A"} años</dd>
              </div>
            </dl>
          </div>

          {/* Información de Institución y Aula */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Institución y Aula</h2>
            <dl className="space-y-3">
              {enrollment.institutionName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Institución</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{enrollment.institutionName}</dd>
                </div>
              )}
              {enrollment.institutionCode && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código Institución</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enrollment.institutionCode}</dd>
                </div>
              )}
              {enrollment.classroomName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Aula</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{enrollment.classroomName}</dd>
                </div>
              )}
              {enrollment.classroomGrade && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Grado</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enrollment.classroomGrade}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Institución</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.institutionId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Aula</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.classroomId}</dd>
              </div>
            </dl>
          </div>

          {/* Progreso de Documentos */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Documentos</h2>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {documentProgress.completed} de {documentProgress.total}
                </span>
                <span className="text-sm font-medium text-gray-700">{documentProgress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    documentProgress.percentage === 100
                      ? "bg-green-600"
                      : documentProgress.percentage >= 70
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${documentProgress.percentage}%` }}
                ></div>
              </div>
            </div>
            <ul className="space-y-2">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <li key={doc.key} className="flex items-center text-sm">
                  {enrollment[doc.key] ? (
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={enrollment[doc.key] ? "text-gray-900" : "text-gray-500"}>{doc.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeClass(status) {
  const classes = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}
