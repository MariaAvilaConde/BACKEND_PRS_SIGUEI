/**
 * Configuración de URLs para el servicio de evaluaciones
 * Ajusta estas URLs según tu backend
 */

export const EVALUATION_ENDPOINTS = {
  // Evaluaciones
  EVALUATIONS: {
    BASE: '/api/evaluations',
    BY_ID: (id) => `/api/evaluations/${id}`,
    DETAILS: (id) => `/api/evaluations/${id}/details`,
    FINALIZE: (id) => `/api/evaluations/${id}/finalize`,
  },

  // Aulas
  CLASSROOMS: {
    BASE: '/api/classrooms',
    BY_ID: (id) => `/api/classrooms/${id}`,
    COURSES: (id) => `/api/classrooms/${id}/courses`,
  },

  // Cursos
  COURSES: {
    BASE: '/api/courses',
    BY_ID: (id) => `/api/courses/${id}`,
    BY_CLASSROOM: (classroomId) => `/api/courses/classroom/${classroomId}`,
    BY_TEACHER_CLASSROOM: (teacherId, classroomId) => `/api/courses/teacher/${teacherId}/classroom/${classroomId}`,
  },

  // Competencias
  COMPETENCIES: {
    BASE: '/api/competencies',
    BY_ID: (id) => `/api/competencies/${id}`,
    BY_COURSE: (courseId) => `/api/competencies/course/${courseId}`,
    BY_COURSE_ACTIVE: (courseId) => `/api/competencies/course/${courseId}/active`,
    BY_COURSE_TEACHER: (courseId, teacherId) => `/api/competencies/course/${courseId}/teacher/${teacherId}`,
  },

  // Estudiantes
  STUDENTS: {
    BASE: '/api/students',
    BY_ID: (id) => `/api/students/${id}`,
    BY_CLASSROOM: (classroomId) => `/api/students/classroom/${classroomId}`,
  },
};

/**
 * Configuración de estados y niveles
 */
export const EVALUATION_CONFIG = {
  // Estados de evaluación
  STATUS: {
    EN_PROCESO: 'EN_PROCESO',
    FINALIZADO: 'FINALIZADO',
  },

  // Niveles de logro
  ACHIEVEMENT_LEVELS: {
    AD: 'AD',
    A: 'A',
    B: 'B',
    C: 'C',
  },

  // Etiquetas de niveles
  ACHIEVEMENT_LABELS: {
    AD: 'Logro Destacado',
    A: 'Logro Esperado',
    B: 'En Proceso',
    C: 'En Inicio',
  },

  // Colores para niveles
  ACHIEVEMENT_COLORS: {
    AD: '#10b981', // Verde
    A: '#3b82f6',  // Azul
    B: '#f59e0b',  // Ámbar
    C: '#ef4444',  // Rojo
  },
};

/**
 * Mensajes de validación
 */
export const VALIDATION_MESSAGES = {
  CLASSROOM_REQUIRED: 'Por favor selecciona un aula',
  COURSE_REQUIRED: 'Por favor selecciona un curso',
  COMPETENCY_REQUIRED: 'Por favor selecciona una competencia',
  DATE_REQUIRED: 'Por favor selecciona una fecha',
  STUDENTS_REQUIRED: 'Por favor evalúa al menos un estudiante',
  ACHIEVEMENT_LEVEL_REQUIRED: 'Por favor selecciona un nivel de logro para cada estudiante',
};

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 10,
  MAX_ITEMS_PER_PAGE: 50,
};
