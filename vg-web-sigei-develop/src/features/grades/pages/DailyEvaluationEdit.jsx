import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import toast from 'react-hot-toast'
import { dailyEvaluationService } from "../services/DailyEvaluation.service"
import { DAILY_EVALUATION_STATUS } from '../models/dailyEvaluation.model'
import { StudentChecklist } from '../components/daily-evaluations'
import { useEvaluationForm } from '../hooks/useEvaluationForm'
import { useEvaluationLoader } from '../hooks/useEvaluationLoader'
import { detailsArrayToMap, getErrorMessage } from '../utils/evaluationHelpers'

export default function DailyEvaluationEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  const form = useEvaluationForm()
  const loader = useEvaluationLoader()

  useEffect(() => {
    if (!user?.institutionId || !id) return
    loadEvaluationData()
  }, [user, id])

  const loadEvaluationData = async () => {
    form.setLoadingData(true)
    form.setError(null)
    
    try {
      // Cargar evaluación existente
      const evaluation = await loader.loadEvaluation(id)
      
      if (evaluation.status === DAILY_EVALUATION_STATUS.FINALIZADO) {
        toast.error('No se puede editar una evaluación finalizada')
        navigate('/docente/evaluaciones-diarias')
        return
      }

      form.setEvaluationDate(evaluation.evaluationDate)
      form.setStatus(evaluation.status)

      // Cargar detalles existentes
      const evalDetails = await loader.loadEvaluationDetails(id)

      // Cargar institución
      const instName = await loader.loadInstitution(user.institutionId)
      form.setInstitutionName(instName)

      // Cargar aula
      const classroomData = await loader.loadClassroom(evaluation.classroomId)
      form.setClassroom(classroomData)

      const level = classroomData?.classroomAge
      if (!level) {
        toast.error('El aula no tiene nivel de edad configurado')
        return
      }

      // Cargar cursos
      const coursesList = await loader.loadCourses(user.institutionId, level)
      form.setCourses(coursesList)

      // Seleccionar curso actual
      const selectedCourse = coursesList.find(c => c.id === evaluation.courseId)
      if (selectedCourse) {
        form.setCourse(selectedCourse)
        await loadCompetencies(selectedCourse.id, evalDetails)
      }
    } catch (err) {
      console.error('[DailyEvalEdit] Error general:', err)
      const errorMsg = getErrorMessage(err)
      form.setError(errorMsg)
      toast.error('Error al cargar la evaluación')
    } finally {
      form.setLoadingData(false)
    }
  }

  const loadCompetencies = async (courseId, evalDetails = []) => {
    form.setLoadingCompetencies(true)
    
    try {
      const list = await loader.loadCompetencies(courseId)
      form.setCompetencies(list)
      
      if (!list.length) {
        form.setCompetency(null)
        return
      }
      
      // Seleccionar la competencia de la evaluación
      const evalCompetencyId = evalDetails[0]?.competencyId
      const selectedCompetency = list.find(c => c.id === evalCompetencyId) || list[0]
      form.setCompetency(selectedCompetency)

      // Cargar detalles existentes en el mapa
      const detailsMap = detailsArrayToMap(evalDetails)
      form.setDetails(detailsMap)
    } catch (err) {
      console.error('[DailyEvalEdit] Error cargando competencias:', err)
      toast.error('Error cargando competencias')
    } finally {
      form.setLoadingCompetencies(false)
    }
  }

  const handleCourseChange = async (courseId) => {
    const selected = form.courses.find(c => c.id === courseId)
    if (!selected) return
    
    form.setCourse(selected)
    form.setCompetency(null)
    form.setDetails(new Map())
    await loadCompetencies(selected.id)
  }

  const handleUpdate = async () => {
    form.setLoading(true)
    
    try {
      const detailsArray = Array.from(form.details.values())

      if (!detailsArray.length) {
        toast.error('Debes evaluar al menos un estudiante')
        return
      }

      // Actualizar cada detalle
      await Promise.all(
        detailsArray.map(d => {
          if (d.id) {
            return dailyEvaluationService.updateDetail({
              evaluationId: id,
              detailId: d.id,
              achievementLevel: d.achievementLevel,
              observation: d.observation
            })
          }
          return Promise.resolve()
        })
      )

      // NOTA: No se actualiza la evaluación completa porque el endpoint tiene problemas
      // Los detalles ya fueron actualizados arriba
      // Si necesitas cambiar la fecha, tendrías que crear una nueva evaluación

      if (form.status === DAILY_EVALUATION_STATUS.FINALIZADO) {
        await dailyEvaluationService.finalize(id)
      }

      toast.success('Evaluación actualizada exitosamente')
      navigate('/docente/evaluaciones-diarias')
    } catch (err) {
      console.error('[DailyEvalEdit] Error al actualizar:', err)
      const errorMsg = getErrorMessage(err)
      toast.error(`Error al actualizar: ${errorMsg}`)
    } finally {
      form.setLoading(false)
    }
  }

  if (form.loadingData) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-40">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (!form.classroom || !form.course || !form.competency) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          <strong>Advertencia:</strong> No se pudieron cargar todos los datos necesarios.
          <button
            onClick={loadEvaluationData}
            className="ml-3 underline text-yellow-600 hover:text-yellow-800"
          >
            Reintentar
          </button>
        </div>
        <button
          onClick={() => navigate('/docente/evaluaciones-diarias')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Volver al listado
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {form.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <span>⚠️</span>
          <div>
            <strong>Error:</strong> {form.error}
            <button
              onClick={loadEvaluationData}
              className="ml-3 underline text-red-600 hover:text-red-800"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editar Notas de Evaluación</h1>
        <button
          onClick={() => navigate('/docente/evaluaciones-diarias')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={e => e.preventDefault()} className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm flex flex-wrap gap-6">
          <span>
            👤 Profesor: <strong>{user?.firstName} {user?.lastName}</strong>
          </span>
          <span>
            🏫 Institución: <strong>{form.institutionName || '—'}</strong>
          </span>
        </div>

        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-4">Los siguientes campos no se pueden modificar:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                🏫 Aula
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 cursor-not-allowed">
                {form.classroom?.classroomName || '—'}
                {form.classroom?.classroomAge && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({form.classroom.classroomAge})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                📚 Curso
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 cursor-not-allowed">
                {form.course?.name || '—'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                🎯 Competencia
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 cursor-not-allowed">
                {form.competency?.name || '—'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                📅 Fecha de evaluación
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 cursor-not-allowed">
                {new Date(form.evaluationDate).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <StudentChecklist
            classroom={form.classroom}
            course={form.course}
            competency={form.competency}
            evaluationDate={form.evaluationDate}
            details={form.details}
            onDetailUpdate={form.handleDetailUpdate}
            onBack={() => navigate('/docente/evaluaciones-diarias')}
            onSave={handleUpdate}
            loading={form.loading}
            isEditMode={true}
          />
        </div>
      </form>
    </div>
  )
}
