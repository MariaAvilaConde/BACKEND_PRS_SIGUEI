import jsPDF from 'jspdf'
import apiClient from '@/core/api/apiClient'
import { uploadPdfToCloudinary } from '@/core/utils/cloudinaryUtils'
import { filtrarPorPeriodo, calcularNLporCompetencia, getConclusion } from '@/core/utils/reportCardUtils'

export async function generarBoletaIndividual({
  student, classroom, user, institution,
  cursosConCompetencias,
  periodNumber, academicYear,
  observations = '', attendancePercentage = null,
  reportCardsService,
}) {
  // 1️⃣ Jalar evaluaciones del aula
  const { data: evalsData } = await apiClient.get(
    '/api/evaluations/teacher/' + user.userId + '/classroom/' + classroom.id
  )
  const evaluaciones = Array.isArray(evalsData) ? evalsData : []
  console.log('[Boleta] Evaluaciones del aula:', evaluaciones.length)

  // 2️⃣ Filtrar por período MINEDU
  const evsFiltradas = filtrarPorPeriodo(evaluaciones, periodNumber, academicYear)
  console.log('[Boleta] Evaluaciones filtradas por período:', evsFiltradas.length)

  // 3️⃣ Jalar detalles solo del estudiante
  const todosDetalles = []
  for (const ev of evsFiltradas) {
    try {
      const { data: detalles } = await apiClient.get('/api/evaluations/' + ev.id + '/details')
      const arr = Array.isArray(detalles) ? detalles : []
      console.log('[Boleta] Detalles evaluacion ' + ev.id + ':', arr.length, 'primer detalle:', JSON.stringify(arr[0]))
      // Buscar por studentId o student_id
      const filtrados = arr.filter(d => {
        return d.studentId === student.id || d.student_id === student.id
      })
      todosDetalles.push(...filtrados)
    } catch (e) {
      console.warn('[Boleta] Error jalando detalles:', e.message)
    }
  }

  console.log('[Boleta] Detalles del estudiante ' + student.id + ':', todosDetalles.length)
  console.log('[Boleta] Primer detalle estudiante:', JSON.stringify(todosDetalles[0]))

  // 4️⃣ Calcular NL por competencia
  const nlPorCompetencia = calcularNLporCompetencia(todosDetalles)
  console.log('[Boleta] NL por competencia:', JSON.stringify(nlPorCompetencia))

  // 5️⃣ Generar PDF
  const pdfBlob = generarPDF({
    student, classroom, user, institution,
    cursosConCompetencias, nlPorCompetencia,
    periodNumber, academicYear,
    observations, attendancePercentage
  })

  // 6️⃣ Subir a Cloudinary
  const fileName = 'boleta_' + student.id + '_B' + periodNumber + '_' + academicYear
  const pdfUrl = await uploadPdfToCloudinary(pdfBlob, fileName)
  console.log('[Boleta] PDF subido:', pdfUrl)

  // 7️⃣ Guardar en BD
  await reportCardsService.create({
    studentId: student.id,
    classroomId: classroom.id,
    institutionId: user.institutionId,
    academicYear,
    periodType: 'BIMESTRE',
    periodNumber,
    attendancePercentage: attendancePercentage || null,
    generalObservations: observations || null,
    pdfUrl,
    status: 'DRAFT'
  })

  return pdfUrl
}

export async function generarBoletasMasivas({
  students, classroom, user, institution,
  cursosConCompetencias, periodNumber, academicYear,
  reportCardsService, onProgress,
}) {
  const resultados = []
  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    if (onProgress) onProgress(i + 1, students.length)
    try {
      const pdfUrl = await generarBoletaIndividual({
        student, classroom, user, institution,
        cursosConCompetencias, periodNumber, academicYear,
        reportCardsService,
      })
      resultados.push({ studentId: student.id, nombre: student.lastName + ' ' + student.firstName, success: true, pdfUrl })
    } catch (err) {
      console.error('Error boleta ' + student.id + ':', err)
      resultados.push({ studentId: student.id, nombre: student.lastName + ' ' + student.firstName, success: false, error: err.message })
    }
  }
  return resultados
}

function generarPDF({
  student, classroom, user, institution,
  cursosConCompetencias, nlPorCompetencia,
  periodNumber, academicYear,
  observations, attendancePercentage
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 12
  const contentW = pageW - margin * 2
  let y = 0

  // ── HEADER ──
  doc.setFillColor(25, 60, 130)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('INFORME DE PROGRESO DE LAS COMPETENCIAS DEL ESTUDIANTE', pageW / 2, 10, { align: 'center' })
  doc.setFontSize(10)
  doc.text('AÑO LECTIVO ' + academicYear, pageW / 2, 18, { align: 'center' })
  doc.setFontSize(8)
  doc.text(institution ? institution.name || 'Institución Educativa' : 'Institución Educativa', pageW / 2, 25, { align: 'center' })

  y = 35
  doc.setTextColor(0, 0, 0)

  // ── DATOS INSTITUCIÓN ──
  doc.setFillColor(235, 240, 255)
  doc.rect(margin, y, contentW, 18, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('DRE: ' + (institution ? institution.dre || '—' : '—'), margin + 2, y + 5)
  doc.text('UGEL: ' + (institution ? institution.ugel || '—' : '—'), margin + 80, y + 5)
  doc.text('Nivel: ' + (institution ? institution.institutionLevel || (classroom ? classroom.classroomAge || '—' : '—') : '—'), margin + 2, y + 11)
  doc.text('Código Modular: ' + (institution ? institution.modularCode || '—' : '—'), margin + 80, y + 11)
  doc.text('Institución educativa: ' + (institution ? institution.name || '—' : '—'), margin + 2, y + 17)

  y += 22

  // ── DATOS ESTUDIANTE ──
  doc.setFillColor(245, 245, 255)
  doc.rect(margin, y, contentW, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Apellidos y nombres del estudiante:', margin + 2, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.text((student ? student.lastName || '' : '') + ' ' + (student ? student.motherLastName || '' : '') + ', ' + (student ? student.firstName || '' : ''), margin + 65, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.text('Código del estudiante:', margin + 2, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.text(student ? student.cui || '—' : '—', margin + 45, y + 12)
  doc.setFont('helvetica', 'bold')
  doc.text('DNI:', margin + 90, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.text(student ? student.documentNumber || '—' : '—', margin + 100, y + 12)
  doc.setFont('helvetica', 'bold')
  doc.text('Apellidos y nombres del docente:', margin + 2, y + 18)
  doc.setFont('helvetica', 'normal')
  doc.text((user ? user.lastName || '' : '') + ', ' + (user ? user.firstName || '' : ''), margin + 65, y + 18)

  y += 26

  // ── CABECERA TABLA ──
  const colArea = 32
  const colComp = 80
  const colNL = 18
  const colConc = contentW - colArea - colComp - colNL

  doc.setFillColor(25, 60, 130)
  doc.rect(margin, y, contentW, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('Área curricular', margin + colArea / 2, y + 6.5, { align: 'center' })
  doc.text('Competencias', margin + colArea + colComp / 2, y + 6.5, { align: 'center' })
  doc.text('NL', margin + colArea + colComp + colNL / 2, y + 6.5, { align: 'center' })
  doc.text('Conclusión descriptiva', margin + colArea + colComp + colNL + colConc / 2, y + 6.5, { align: 'center' })

  y += 10
  doc.setTextColor(0, 0, 0)

  // ── FILAS POR CURSO Y COMPETENCIA ──
  cursosConCompetencias.forEach((curso, ci) => {
    const rowHeight = 8
    const compCount = curso.competencies ? curso.competencies.length : 0
    if (!compCount) return

    const areaH = compCount * rowHeight
    const bgArea = ci % 2 === 0 ? [240, 244, 255] : [248, 248, 255]

    doc.setFillColor(bgArea[0], bgArea[1], bgArea[2])
    doc.rect(margin, y, colArea, areaH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    const areaLines = doc.splitTextToSize(curso.name.toUpperCase(), colArea - 2)
    const areaTextY = y + areaH / 2 - (areaLines.length * 3) / 2 + 3
    areaLines.forEach((line, li) => {
      doc.text(line, margin + colArea / 2, areaTextY + li * 3.5, { align: 'center' })
    })

    curso.competencies.forEach((comp, idx) => {
      const rowY = y + idx * rowHeight
      const nl = nlPorCompetencia[comp.id] || '—'
      const conclusion = nl !== '—' ? getConclusion(nl) : ''

      const bgRow = idx % 2 === 0 ? [252, 252, 255] : [245, 245, 255]
      doc.setFillColor(bgRow[0], bgRow[1], bgRow[2])
      doc.rect(margin + colArea, rowY, colComp, rowHeight, 'F')
      doc.rect(margin + colArea + colComp, rowY, colNL, rowHeight, 'F')
      doc.rect(margin + colArea + colComp + colNL, rowY, colConc, rowHeight, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(0, 0, 0)
      const compLines = doc.splitTextToSize(comp.name, colComp - 3)
      doc.text(compLines[0], margin + colArea + 2, rowY + 5)

      const nlColors = {
        AD: [0, 130, 0],
        A: [0, 80, 180],
        B: [180, 120, 0],
        C: [180, 0, 0],
        '—': [150, 150, 150]
      }
      const nlColor = nlColors[nl] || [0, 0, 0]
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(nlColor[0], nlColor[1], nlColor[2])
      doc.text(nl, margin + colArea + colComp + colNL / 2, rowY + 5, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(60, 60, 60)
      if (conclusion) {
        const concLines = doc.splitTextToSize(conclusion, colConc - 3)
        doc.text(concLines[0], margin + colArea + colComp + colNL + 2, rowY + 5)
      }

      doc.setTextColor(0, 0, 0)
    })

    doc.setDrawColor(200, 200, 220)
    doc.rect(margin, y, colArea, areaH)
    doc.rect(margin + colArea, y, colComp, areaH)
    doc.rect(margin + colArea + colComp, y, colNL, areaH)
    doc.rect(margin + colArea + colComp + colNL, y, colConc, areaH)

    y += areaH + 1

    if (y > 265) {
      doc.addPage()
      y = 15
    }
  })

  y += 5

  // ── LEYENDA ──
  if (y > 240) { doc.addPage(); y = 15 }
  doc.setFillColor(240, 244, 255)
  doc.rect(margin, y, contentW, 24, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('ESCALA DE CALIFICACIÓN:', margin + 2, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 130, 0)
  doc.text('AD - Logro Destacado: El estudiante evidencia un nivel superior a lo esperado.', margin + 2, y + 11)
  doc.setTextColor(0, 80, 180)
  doc.text('A - Logro Esperado: El estudiante evidencia el nivel esperado.', margin + 2, y + 16)
  doc.setTextColor(180, 120, 0)
  doc.text('B - En Proceso: El estudiante está próximo al nivel esperado.', margin + 2, y + 21)
  doc.setTextColor(180, 0, 0)
  doc.text('C - En Inicio: El estudiante muestra un progreso mínimo.', margin + 100, y + 11)
  doc.setTextColor(0, 0, 0)

  y += 28

  // ── ASISTENCIA ──
  if (attendancePercentage) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Porcentaje de asistencia: ' + attendancePercentage + '%', margin, y)
    y += 7
  }

  // ── OBSERVACIONES ──
  if (observations) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Observaciones generales:', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    const obsLines = doc.splitTextToSize(observations, contentW)
    doc.text(obsLines, margin, y)
    y += obsLines.length * 4.5 + 5
  }

  y += 8

  // ── FIRMAS ──
  if (y > 265) { doc.addPage(); y = 20 }
  doc.setDrawColor(0, 0, 0)
  doc.line(margin, y, margin + 65, y)
  doc.line(pageW - margin - 65, y, pageW - margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Firma del Docente o Tutor(a)', margin + 32, y + 5, { align: 'center' })
  doc.text('Firma y sello del Director(a)', pageW - margin - 32, y + 5, { align: 'center' })

  // ── FECHA EMISIÓN ──
  doc.setFontSize(6.5)
  doc.setTextColor(140, 140, 140)
  const fechaEmision = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  doc.text('Fecha de Emisión: ' + fechaEmision, pageW / 2, 292, { align: 'center' })

  return doc.output('blob')
}