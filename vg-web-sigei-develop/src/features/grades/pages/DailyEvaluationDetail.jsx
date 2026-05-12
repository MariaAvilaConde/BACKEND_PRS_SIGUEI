import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'
import { getAchievementConfig, getStatusClass, getStatusLabel } from '../models/dailyEvaluation.model'
import apiClient from '@/core/api/apiClient'
import { ArrowLeft, Calendar, BookOpen, Users, Award, Trash2, AlertCircle, Edit } from 'lucide-react'

export default function DailyEvaluationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [evaluation, setEvaluation] = useState(null)
  const [details, setDetails] = useState([])
  const [students, setStudents] = useState([])
  const [courseName, setCourseName] = useState('')
  const [classroomName, setClassroomName] = useState('')
  const [competencyName, setCompetencyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { if (id) load(id) }, [id])

  const load = async (evalId) => {
    try {
      setLoading(true)
      const [ev, dets] = await Promise.all([
        dailyEvaluationService.getById(evalId),
        dailyEvaluationService.getDetails(evalId),
      ])
      setEvaluation(ev)
      setDetails(dets)

      if (ev?.classroomId) {
        try {
          const { data } = await apiClient.get(`/api/v1/classrooms/${ev.classroomId}`)
          const classroom = data?.data || data
          setClassroomName(classroom?.name || classroom?.classroomName || ev.classroomId)
        } catch { setClassroomName(ev.classroomId) }
      }

      if (ev?.courseId) {
        try {
          const { data } = await apiClient.get(`/api/v1/courses/${ev.courseId}`)
          const c = data?.data || data
          setCourseName(c?.name || c?.courseName || ev.courseId)
        } catch { setCourseName(ev.courseId) }
      }

      if (dets.length > 0 && dets[0].competencyId) {
        try {
          const { data } = await apiClient.get(`/api/v1/competencies/${dets[0].competencyId}`)
          const comp = data?.data || data
          setCompetencyName(comp?.name || comp?.competencyName || dets[0].competencyId)
        } catch { setCompetencyName(dets[0].competencyId) }
      }

      if (ev?.classroomId) {
        try {
          const { data } = await apiClient.get(`/api/students/classroom/${ev.classroomId}`)
          const list = data?.data || data || []
          setStudents(Array.isArray(list) ? list : [])
        } catch { /* sin nombres */ }
      }
    } catch {
      setError('Error al cargar la evaluación diaria')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta evaluación?')) return
    try {
      await dailyEvaluationService.delete(id)
      navigate('/docente/evaluaciones-diarias')
    } catch {
      setError('Error al eliminar la evaluación')
    }
  }

  const getStudentName = (studentId) => {
    const s = students.find(st => st.id === studentId)
    if (!s) return studentId?.slice(0, 12) + '…'
    return `${s.lastName} ${s.motherLastName || ''}, ${s.firstName}`.trim()
  }

  const getInitials = (studentId) => {
    const s = students.find(st => st.id === studentId)
    if (!s) return '??'
    return ((s.firstName?.[0] || '') + (s.lastName?.[0] || '')).toUpperCase()
  }

  const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Cargando evaluación...</p>
    </div>
  )

  if (error || !evaluation) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-red-50 border border-red-100 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error || 'Evaluación no encontrada'}</p>
            <button 
              onClick={() => navigate('/docente/evaluaciones-diarias')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const levelCounts = details.reduce((acc, d) => {
    if (d.achievementLevel) acc[d.achievementLevel] = (acc[d.achievementLevel] || 0) + 1
    return acc
  }, {})

  const achievementLevels = [
    { key: 'AD', label: 'AD', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'A', label: 'A', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'B', label: 'B', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'C', label: 'C', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate('/docente/evaluaciones-diarias')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Volver al listado
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Evaluación</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resultados y estadísticas completas
          </p>
        </div>
        
        {evaluation.status !== 'FINALIZADO' && (
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/docente/evaluaciones-diarias/${id}/editar`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all"
            >
              <Edit size={16} />
              Editar Notas
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-xl transition-all"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Users size={16} className="text-indigo-600" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Aula</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{classroomName}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Curso</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{courseName}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Award size={16} className="text-purple-600" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Competencia</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{competencyName}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar size={16} className="text-gray-600" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Fecha</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(evaluation.evaluationDate).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 my-6" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total</p>
              <p className="text-2xl font-bold text-gray-900">{details.length}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Estado</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(evaluation.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${evaluation.status === 'FINALIZADO' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {getStatusLabel(evaluation.status)}
              </span>
            </div>

            {achievementLevels.map(level => (
              <div 
                key={level.key} 
                className={`rounded-lg p-4 text-center border ${level.bg} ${level.border}`}
              >
                <p className={`text-xs font-bold uppercase mb-2 ${level.color}`}>
                  {level.label}
                </p>
                <p className={`text-2xl font-bold ${level.color}`}>
                  {levelCounts[level.key] || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resultados por Estudiante
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel de Logro</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {details.map((d, i) => {
                  const conf = getAchievementConfig(d.achievementLevel)
                  const levelData = achievementLevels.find(l => l.key === d.achievementLevel)
                  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarColor}`}>
                            {getInitials(d.studentId)}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {getStudentName(d.studentId)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {conf && levelData ? (
                          <span 
                            className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-lg border ${levelData.bg} ${levelData.border} ${levelData.color}`}
                          >
                            {conf.value} — {conf.description}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin evaluar</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {d.observation || <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
