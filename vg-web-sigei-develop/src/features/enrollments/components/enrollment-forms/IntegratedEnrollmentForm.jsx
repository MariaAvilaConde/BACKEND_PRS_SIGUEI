import { useState } from "react";
import PropTypes from "prop-types";
import { User, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { EnrollmentForm } from "./EnrollmentForm";
import { REQUIRED_DOCUMENTS, createEmptyEnrollment } from "../../models/enrollmentModel";
import { useAuth } from "@/core/auth/AuthContext";

/**
 * Formulario de matrícula con opciones de integración y documentos
 */
export function IntegratedEnrollmentForm({
  enrollment,
  onSubmit,
  onCancel,
  isLoading = false,
  integrationOptions = {},
}) {
  const { user } = useAuth(); // Obtener usuario autenticado
  const [formData, setFormData] = useState(enrollment || createEmptyEnrollment(user?.institutionId));
  const [activeTab, setActiveTab] = useState("basic");
  const [documents, setDocuments] = useState(
    enrollment
      ? REQUIRED_DOCUMENTS.reduce((acc, doc) => {
        acc[doc.key] = enrollment[doc.key] || false;
        return acc;
      }, {})
      : REQUIRED_DOCUMENTS.reduce((acc, doc) => {
        acc[doc.key] = false;
        return acc;
      }, {})
  );

  // Función para actualizar los datos del formulario desde el EnrollmentForm
  const handleFormDataChange = (updatedData) => {
    setFormData(updatedData);
  };

  const handleFormSubmit = (enrollmentData) => {
    // Combinar datos del formulario con documentos
    const completeData = {
      ...enrollmentData,
      ...documents,
    };
    onSubmit(completeData);
  };

  const handleDocumentChange = (docKey, checked) => {
    setDocuments((prev) => ({
      ...prev,
      [docKey]: checked,
    }));
  };

  const toggleAllDocuments = (checked) => {
    const newDocuments = REQUIRED_DOCUMENTS.reduce((acc, doc) => {
      acc[doc.key] = checked;
      return acc;
    }, {});
    setDocuments(newDocuments);
  };

  // Calcular progreso de documentos
  const totalDocs = REQUIRED_DOCUMENTS.length;
  const completedDocs = Object.values(documents).filter(Boolean).length;
  const progress = Math.round((completedDocs / totalDocs) * 100);

  // Documentos requeridos vs opcionales
  const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
  const optionalDocs = REQUIRED_DOCUMENTS.filter(doc => !doc.required);
  const completedRequiredDocs = requiredDocs.filter(doc => documents[doc.key]).length;
  const requiredProgress = Math.round((completedRequiredDocs / requiredDocs.length) * 100);

  return (
    <div className="space-y-6">
      {/* Navegación por pestañas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === "basic"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <User className="h-5 w-5 mr-2" />
              Información Básica
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === "documents"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              Documentos
              <div className="ml-2 flex items-center gap-1">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${progress === 100 ? 'bg-green-100 text-green-800' :
                  progress >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {completedDocs}/{totalDocs}
                </span>
                {requiredProgress === 100 && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
          {activeTab === "basic" && (
            <EnrollmentForm
              enrollment={formData}
              onSubmit={handleFormSubmit}
              onCancel={onCancel}
              isLoading={isLoading}
              hideButtons={true} // Ocultamos los botones del formulario básico
              onFormDataChange={handleFormDataChange} // Pasar callback para sincronizar datos
            />
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Header de documentos */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Documentos Requeridos
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Marque los documentos que el estudiante ha presentado
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAllDocuments(completedDocs < totalDocs)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={isLoading}
                >
                  {completedDocs < totalDocs ? "Marcar todos" : "Desmarcar todos"}
                </button>
              </div>

              {/* Barra de progreso mejorada */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progreso Total: {completedDocs} de {totalDocs}
                      </span>
                      <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Obligatorios: {completedRequiredDocs} de {requiredDocs.length}
                      </span>
                      <span className="text-sm font-bold text-green-600">{requiredProgress}%</span>
                    </div>
                  </div>
                  {requiredProgress === 100 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Completo</span>
                    </div>
                  )}
                </div>

                {/* Barra de progreso visual */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${progress === 100 ? "bg-green-500" :
                        progress >= 70 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${requiredProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Documentos Obligatorios */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold text-gray-900">Documentos Obligatorios</h4>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {requiredDocs.length} requeridos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredDocs.map((doc) => (
                    <DocumentCard
                      key={doc.key}
                      doc={doc}
                      checked={documents[doc.key]}
                      onChange={(checked) => handleDocumentChange(doc.key, checked)}
                      disabled={isLoading}
                      required={true}
                    />
                  ))}
                </div>
              </div>

              {/* Documentos Opcionales */}
              {optionalDocs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-900">Documentos Opcionales</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {optionalDocs.length} opcionales
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {optionalDocs.map((doc) => (
                      <DocumentCard
                        key={doc.key}
                        doc={doc}
                        checked={documents[doc.key]}
                        onChange={(checked) => handleDocumentChange(doc.key, checked)}
                        disabled={isLoading}
                        required={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Nota informativa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Información importante:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Los documentos marcados con <span className="text-red-600 font-medium">*</span> son obligatorios para completar la matrícula</li>
                      <li>• Puede marcar documentos opcionales si el estudiante los ha presentado</li>
                      <li>• El progreso se guarda automáticamente al crear la matrícula</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${requiredProgress === 100 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              <span>
                {requiredProgress === 100 ? 'Documentos obligatorios completos' : 'Faltan documentos obligatorios'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${progress === 100 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              <span>{progress}% de documentos completados</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                // Simular envío del formulario básico con documentos
                const basicData = formData || {};
                handleFormSubmit(basicData);
              }}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Crear Matrícula
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para cada tarjeta de documento
 */
function DocumentCard({ doc, checked, onChange, disabled, required }) {
  const getDocumentIcon = (key) => {
    const icons = {
      birthCertificate: "📄",
      studentDni: "🆔",
      guardianDni: "👤",
      vaccinationCard: "💉",
      disabilityCertificate: "♿",
      utilityBill: "🧾",
      psychologicalReport: "🧠",
      studentPhoto: "📸",
      healthRecord: "🏥",
      signedEnrollmentForm: "📝",
      dniVerification: "✅"
    };
    return icons[key] || "📄";
  };

  return (
    <label
      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${checked
        ? required
          ? "border-green-500 bg-green-50"
          : "border-blue-500 bg-blue-50"
        : "border-gray-200 bg-white hover:border-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />

      <div className="flex items-center gap-3 flex-1">
        <div className="text-2xl">{getDocumentIcon(doc.key)}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{doc.label}</span>
            {required && <span className="text-red-500 text-sm">*</span>}
          </div>
          <span className="text-xs text-gray-500">
            {required ? "Obligatorio" : "Opcional"}
          </span>
        </div>
      </div>

      {checked && (
        <CheckCircle className={`h-5 w-5 ${required ? "text-green-500" : "text-blue-500"
          }`} />
      )}
    </label>
  );
}

IntegratedEnrollmentForm.propTypes = {
  enrollment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  integrationOptions: PropTypes.object,
};

DocumentCard.propTypes = {
  doc: PropTypes.object.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool.isRequired,
};
