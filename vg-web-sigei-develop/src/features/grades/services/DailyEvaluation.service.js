import apiClient from '@/core/api/apiClient'

export const dailyEvaluationService = {

  async getCompetenciesByCourse(courseId) {
    const { data } = await apiClient.get(
      `/api/v1/competencies/course/${courseId}/active`
    )
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async list() {
    const { data } = await apiClient.get('/api/evaluations')
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getById(evaluationId) {
    const { data } = await apiClient.get(`/api/evaluations/${evaluationId}`)
    return data
  },

  async delete(evaluationId) {
    // No se permite eliminar evaluaciones por transparencia del sistema y trazabilidad de datos
    throw new Error('No se puede eliminar evaluaciones por políticas de transparencia y trazabilidad del sistema educativo. Las evaluaciones quedan registradas permanentemente.')
  },

  async create(payload) {
    const { data } = await apiClient.post('/api/evaluations', payload)
    return data?.id || data
  },

  async getDetails(evaluationId) {
    const { data } = await apiClient.get(`/api/evaluations/${evaluationId}/details`)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async updateDetail({ evaluationId, detailId, achievementLevel, observation }) {
    const { data } = await apiClient.put(
      `/api/evaluations/${evaluationId}/details/${detailId}`,
      { achievementLevel, observation }
    )
    return data
  },

  async finalize(evaluationId) {
    const { data } = await apiClient.put(`/api/evaluations/${evaluationId}/finalize`)
    return data
  },

  async update(evaluationId, payload) {
    const { data } = await apiClient.put(`/api/evaluations/${evaluationId}`, payload)
    return data
  },

  async getByTeacherAndClassroom(teacherId, classroomId) {
    const { data } = await apiClient.get(
      `/api/evaluations/teacher/${teacherId}/classroom/${classroomId}`
    )
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async checkExists(classroomId, courseId, competencyId, evaluationDate) {
    const { data } = await apiClient.get('/api/evaluations/exists', {
      params: { classroomId, courseId, competencyId, evaluationDate }
    })
    return data
  },

  async getCoursesByTeacherAndClassroom(teacherId, classroomId) {
    const { data } = await apiClient.get(
      `/api/evaluations/teacher/${teacherId}/classroom/${classroomId}/courses`
    )
    return Array.isArray(data) ? data : (data?.data || [])
  },
}
