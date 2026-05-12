import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronDown, User, Plus, Search, AlertCircle, CheckCircle, Info } from "lucide-react";
import { studentService } from "@/features/students/services/studentService";
import { enrollmentService } from "../../services/enrollmentService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { CreateStudentModal } from "../modals/CreateStudentModal";

/**
 * Selector mejorado de estudiantes con opción de crear nuevo
 */
export function EnhancedStudentSelector({ value, onChange, institutionId, disabled = false }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (institutionId) {
      fetchStudents(institutionId);
    } else {
      setStudents([]);
      setSearchTerm("");
      setSearchResult(null);
    }
  }, [institutionId]);

  const fetchStudents = async (instId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("📚 Cargando estudiantes para institución:", instId);
      const response = await studentService.getByInstitution(instId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      const studentsList = Array.isArray(data) ? data : [];
      console.log("📚 Estudiantes cargados:", studentsList.length);
      setStudents(studentsList);
    } catch (err) {
      setError("Error al cargar los estudiantes");
      console.error("❌ Error fetching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar estudiante por DNI cuando se presiona Enter
  const handleSearchKeyPress = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      await searchStudentByDNI(searchTerm.trim());
    }
  };

  const searchStudentByDNI = async (dni) => {
    if (dni.length !== 8 || !/^\d+$/.test(dni)) {
      setSearchResult({
        type: 'error',
        message: 'El DNI debe tener 8 dígitos numéricos'
      });
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      console.log("🔍 Buscando estudiante por DNI:", dni);
      
      // Buscar en la lista local primero
      const localStudent = students.find(s => s.documentNumber === dni);
      
      if (localStudent) {
        console.log("✅ Estudiante encontrado en lista local:", localStudent);
        
        // Verificar si ya está matriculado
        try {
          const enrollmentsResponse = await enrollmentService.getByStudent(localStudent.id);
          const enrollments = isSuccessResponse(enrollmentsResponse) ? extractData(enrollmentsResponse) : enrollmentsResponse;
          
          const activeEnrollment = Array.isArray(enrollments) && enrollments.find(
            e => e.institutionId === institutionId && (e.enrollmentStatus === 'ACTIVE' || e.enrollmentStatus === 'PENDING')
          );

          if (activeEnrollment) {
            setSearchResult({
              type: 'warning',
              message: `Alumno ya matriculado en el aula "${activeEnrollment.classroomName || 'Sin nombre'}"`,
              student: localStudent,
              enrollment: activeEnrollment
            });
          } else {
            // Estudiante encontrado y no matriculado
            setSearchResult({
              type: 'success',
              message: 'Estudiante encontrado y disponible para matrícula',
              student: localStudent
            });
            onChange(localStudent.id);
          }
        } catch (err) {
          console.error("❌ Error al verificar matrículas:", err);
          // Si falla la verificación, permitir seleccionar el estudiante
          setSearchResult({
            type: 'success',
            message: 'Estudiante encontrado',
            student: localStudent
          });
          onChange(localStudent.id);
        }
      } else {
        // No encontrado en lista local
        setSearchResult({
          type: 'info',
          message: `No se encontró estudiante con DNI ${dni} en esta institución`,
          showCreateButton: true
        });
      }
    } catch (err) {
      console.error("❌ Error en búsqueda:", err);
      setSearchResult({
        type: 'error',
        message: 'Error al buscar el estudiante'
      });
    } finally {
      setSearching(false);
    }
  };

  // Filtrar estudiantes basado en el término de búsqueda
  const filteredStudents = searchTerm.trim() 
    ? students.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${student.firstName || ''} ${student.lastName || ''} ${student.motherLastName || ''}`.toLowerCase();
        const documentNumber = student.documentNumber || '';
        const cui = student.cui || '';
        
        return fullName.includes(searchLower) || 
               documentNumber.includes(searchTerm) || 
               cui.includes(searchTerm);
      })
    : students;

  const selectedStudent = students.find(student => student.id === value);

  const handleCreateNew = () => {
    console.log("➕ Abriendo modal para crear estudiante");
    setShowCreateModal(true);
  };

  const handleStudentCreated = (newStudent) => {
    console.log("✅ Estudiante creado:", newStudent);
    
    // Agregar el nuevo estudiante a la lista
    setStudents(prev => [newStudent, ...prev]);
    
    // Seleccionar automáticamente el nuevo estudiante
    onChange(newStudent.id);
    
    // Cerrar modal
    setShowCreateModal(false);
    
    // Limpiar búsqueda
    setSearchTerm("");
    setSearchResult(null);
  };

  const getStudentAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      <div className="space-y-3">
        {/* Buscador de estudiantes - PRIMERO para mejor UX */}
        {students.length > 0 && (
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por DNI (presione Enter) o nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchResult(null); // Limpiar resultado al escribir
              }}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || searching}
            />
            <Search className={`absolute left-3 top-2.5 h-4 w-4 ${searching ? 'animate-pulse text-blue-500' : 'text-gray-400'}`} />
            {searchTerm && !searching && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchResult(null);
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Resultado de búsqueda por DNI */}
        {searchResult && (
          <div className={`rounded-md p-3 text-sm border ${
            searchResult.type === 'success' ? 'bg-green-50 border-green-200' :
            searchResult.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            searchResult.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              {searchResult.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
              {searchResult.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />}
              {searchResult.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
              {searchResult.type === 'info' && <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className={`font-medium ${
                  searchResult.type === 'success' ? 'text-green-800' :
                  searchResult.type === 'warning' ? 'text-yellow-800' :
                  searchResult.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {searchResult.message}
                </p>
                {searchResult.student && (
                  <p className="text-xs mt-1 text-gray-700">
                    {searchResult.student.firstName} {searchResult.student.lastName} {searchResult.student.motherLastName}
                  </p>
                )}
                {searchResult.showCreateButton && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-xs"
                  >
                    ➕ Crear nuevo estudiante con este DNI
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mostrar resultados de búsqueda si hay término de búsqueda */}
        {searchTerm && filteredStudents.length > 0 && !searchResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-sm text-blue-800">
            <p className="font-medium">
              {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs mt-1">
              💡 Presione Enter para buscar por DNI exacto
            </p>
          </div>
        )}

        {/* Mensaje si no hay resultados */}
        {searchTerm && filteredStudents.length === 0 && students.length > 0 && !searchResult && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-medium">No se encontraron estudiantes con "{searchTerm}"</p>
            <p className="text-xs mt-1">
              💡 Presione Enter para buscar por DNI exacto
            </p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              ➕ ¿Desea crear un nuevo estudiante?
            </button>
          </div>
        )}

        {/* Selector principal */}
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => {
              const selectedValue = e.target.value;
              
              if (selectedValue === "CREATE_NEW") {
                // Resetear el select
                e.target.value = "";
                handleCreateNew();
              } else {
                onChange(selectedValue);
                setSearchResult(null);
              }
            }}
            disabled={disabled || loading || !institutionId}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
          >
            <option value="">
              {loading ? "Cargando estudiantes..." : 
               !institutionId ? "Seleccione una institución primero" : 
               students.length === 0 ? "No hay estudiantes disponibles" :
               searchTerm ? `Seleccione de ${filteredStudents.length} resultado(s)` :
               "Seleccione un estudiante"}
            </option>
            
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} {student.motherLastName} - DNI: {student.documentNumber}
              </option>
            ))}
            
            {/* Opción para crear nuevo estudiante */}
            {institutionId && (
              <option value="CREATE_NEW" className="font-medium text-blue-600">
                ➕ Crear nuevo estudiante
              </option>
            )}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Información del estudiante seleccionado */}
        {selectedStudent && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent.motherLastName}
                </p>
                <p className="text-xs text-blue-700">
                  DNI: {selectedStudent.documentNumber}
                  {selectedStudent.cui && ` • CUI: ${selectedStudent.cui}`}
                  {selectedStudent.dateOfBirth && ` • Edad: ${getStudentAge(selectedStudent.dateOfBirth)} años`}
                </p>
                {selectedStudent.dateOfBirth && (
                  <p className="text-xs text-blue-600">
                    Nacimiento: {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón para crear nuevo estudiante (alternativo y más visible) */}
        {institutionId && (
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            ¿No encuentra al estudiante? Crear nuevo
          </button>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Modal para crear estudiante */}
      <CreateStudentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStudentCreated={handleStudentCreated}
        institutionId={institutionId}
      />
    </>
  );
}

EnhancedStudentSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  institutionId: PropTypes.string,
  disabled: PropTypes.bool,
};