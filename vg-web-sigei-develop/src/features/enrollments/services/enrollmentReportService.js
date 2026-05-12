import { jsPDF } from "jspdf";
import {
  drawHeader,
  drawTable,
  loadLogoBase64,
} from "@/core/utils/reportGenerator";
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_TYPE_LABELS } from "../models/enrollmentModel";

/**
 * Servicio para generar reportes PDF de matrículas (enrollments)
 * Reutiliza las funciones de reportGenerator.js para mantener consistencia
 */

// ── Funciones auxiliares ─────────────────────────────────────────────────────

function statusLabel(s) {
  return ENROLLMENT_STATUS_LABELS[s] || s || "—";
}

function typeLabel(t) {
  return ENROLLMENT_TYPE_LABELS[t] || t || "—";
}

function buildFileStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

function truncate(text, maxLen = 60) {
  if (!text) return "—";
  return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

// ── PDF Report: Lista de Matrículas ──────────────────────────────────────────

/**
 * Genera un reporte PDF con la lista de matrículas
 * @param {Array} enrollments - Lista de matrículas
 * @param {Object} institution - Datos de la institución
 * @param {Object} filters - Filtros aplicados (opcional)
 */
export async function generateEnrollmentsListReport(enrollments, institution, filters = {}) {
  console.log("📊 Generando reporte de lista de matrículas");
  console.log("📊 Total de matrículas:", enrollments.length);
  console.log("🏫 Institución:", institution);
  console.log("🖼️ Logo URL de institución:", institution?.logoUrl);
  
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);
  
  console.log("🖼️ Logo Base64 cargado:", logoBase64 ? "SÍ" : "NO");

  // Construir subtítulo con filtros
  let subtitle = `Total: ${enrollments.length} matrícula(s) registrada(s)`;
  if (filters.academicYear) subtitle += ` | Año: ${filters.academicYear}`;
  if (filters.status) subtitle += ` | Estado: ${statusLabel(filters.status)}`;
  if (filters.ageGroup) subtitle += ` | Edad: ${filters.ageGroup}`;

  const title = "Reporte de Matrículas";
  const y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // Preparar datos para la tabla
  const headers = ["#", "Código", "Estudiante", "Aula", "Edad", "Turno", "Sección", "Estado"];
  const colWidths = [10, 25, 55, 35, 20, 25, 20, 25];

  const rows = enrollments.map((enrollment, i) => [
    String(i + 1),
    truncate(enrollment.enrollmentCode || "Sin código", 20),
    truncate(enrollment.studentFullName || "Sin nombre", 45),
    truncate(enrollment.classroomName || "—", 30),
    enrollment.ageGroup || "—",
    enrollment.shift || "—",
    enrollment.section || "—",
    statusLabel(enrollment.enrollmentStatus),
  ]);

  drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

  const fileName = `reporte_matriculas_${buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Reporte generado exitosamente");
}

// ── PDF Report: Ficha de Matrícula Individual ───────────────────────────────

/**
 * Genera un reporte PDF detallado de una matrícula específica
 * @param {Object} enrollment - Datos de la matrícula
 * @param {Object} student - Datos del estudiante
 * @param {Object} institution - Datos de la institución
 * @param {Object} classroom - Datos del aula (opcional)
 * @param {Object} academicPeriod - Datos del período académico (opcional)
 */
export async function generateEnrollmentDetailReport(
  enrollment,
  student,
  institution,
  classroom = null,
  academicPeriod = null
) {
  console.log("📄 Generando ficha de matrícula individual");
  console.log("📄 Matrícula:", enrollment);
  console.log("👤 Estudiante:", student);
  console.log("🏫 Institución:", institution);
  console.log("🖼️ Logo URL de institución:", institution?.logoUrl);
  
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);
  
  console.log("🖼️ Logo Base64 cargado:", logoBase64 ? "SÍ" : "NO");

  const subtitle = `Código: ${enrollment.enrollmentCode || "Sin código"} | Estudiante: ${truncate(enrollment.studentFullName || student?.firstName + " " + student?.lastName || "Sin nombre", 40)}`;
  const title = "Ficha de Matrícula";
  const y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // Preparar datos para la tabla de información
  const headers = ["Campo", "Valor"];
  const colWidths = [70, 110];

  const rows = [
    ["Código de Matrícula", enrollment.enrollmentCode || "—"],
    ["Estudiante", enrollment.studentFullName || student?.firstName + " " + student?.lastName || "—"],
    ["CUI", student?.cui || "—"],
    ["Documento", `${student?.documentType || ""} ${student?.documentNumber || ""}`.trim() || "—"],
    ["Año Académico", enrollment.academicYear || "—"],
    ["Período Académico", academicPeriod?.periodName || "—"],
    ["Aula", classroom?.classroomName || enrollment.classroomName || "—"],
    ["Grupo de Edad", enrollment.ageGroup || "—"],
    ["Turno", enrollment.shift || "—"],
    ["Sección", enrollment.section || "—"],
    ["Modalidad", enrollment.modality || "—"],
    ["Tipo de Matrícula", typeLabel(enrollment.enrollmentType)],
    ["Estado", statusLabel(enrollment.enrollmentStatus)],
    ["Fecha de Matrícula", enrollment.enrollmentDate || "—"],
  ];

  if (enrollment.observations) {
    rows.push(["Observaciones", truncate(enrollment.observations, 80)]);
  }

  drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

  const fileName = `ficha_matricula_${enrollment.enrollmentCode || buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Ficha de matrícula generada exitosamente");
}

/**
 * Genera un reporte consolidado de matrículas por aula
 * @param {Array} enrollments - Lista de matrículas
 * @param {Object} classroom - Datos del aula
 * @param {Object} institution - Datos de la institución
 */
export async function generateClassroomEnrollmentsReport(enrollments, classroom, institution) {
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const subtitle = `Aula: ${classroom.classroomName} | Edad: ${classroom.classroomAge} | Total: ${enrollments.length} estudiantes`;
  let y = drawHeader(
    doc,
    institution,
    "LISTA DE ESTUDIANTES POR AULA",
    subtitle,
    logoBase64
  );

  y += 5;

  // Información del aula
  y = drawSectionTitle(doc, "INFORMACIÓN DEL AULA", y, institution);
  y += 2;

  const col1X = 15;
  const col2X = 110;

  drawField(doc, "Nombre del Aula", classroom.classroomName, col1X, y);
  drawField(doc, "Capacidad", `${enrollments.length}/${classroom.capacity}`, col2X, y);
  y += 6;

  drawField(doc, "Grupo de Edad", classroom.classroomAge, col1X, y);
  drawField(doc, "Estado", classroom.status === "ACTIVE" ? "Activo" : "Inactivo", col2X, y);
  y += 10;

  // Lista de estudiantes
  y = drawSectionTitle(doc, "ESTUDIANTES MATRICULADOS", y, institution);
  y += 2;

  enrollments.forEach((enrollment, index) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 30) {
      drawFooter(doc, institution, "?", "?");
      doc.addPage();
      y = drawHeader(doc, institution, "LISTA DE ESTUDIANTES POR AULA", subtitle, logoBase64);
      y += 5;
    }

    const num = index + 1;
    const title = enrollment.studentFullName || "Sin nombre";
    const subtitle = `CUI: ${enrollment.student?.cui || "—"} | DNI: ${enrollment.student?.documentNumber || "—"}`;
    const meta = `Turno: ${enrollment.shift} | Sección: ${enrollment.section} | Código: ${enrollment.enrollmentCode || "—"}`;
    const badge = getStatusLabel(enrollment.enrollmentStatus);

    y = drawListEntry(doc, num, title, subtitle, meta, badge, y, index % 2 === 0);
  });

  drawFooter(doc, institution, 1, 1);

  // Guardar el PDF
  const fileName = `Lista_Aula_${classroom.classroomName}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Genera un reporte estadístico de matrículas
 * @param {Object} stats - Estadísticas de matrículas
 * @param {Object} institution - Datos de la institución
 */
export async function generateEnrollmentStatsReport(stats, institution) {
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const subtitle = `Período: ${stats.academicYear || "Todos"} | Generado: ${new Date().toLocaleDateString("es-PE")}`;
  let y = drawHeader(
    doc,
    institution,
    "ESTADÍSTICAS DE MATRÍCULAS",
    subtitle,
    logoBase64
  );

  y += 5;

  // Resumen General
  y = drawSectionTitle(doc, "RESUMEN GENERAL", y, institution);
  y += 2;

  const col1X = 15;
  const col2X = 110;

  drawField(doc, "Total Matrículas", stats.totalEnrollments || 0, col1X, y);
  drawField(doc, "Matrículas Activas", stats.activeEnrollments || 0, col2X, y);
  y += 6;

  drawField(doc, "Matrículas Pendientes", stats.pendingEnrollments || 0, col1X, y);
  drawField(doc, "Matrículas Canceladas", stats.cancelledEnrollments || 0, col2X, y);
  y += 10;

  // Por Grupo de Edad
  if (stats.byAgeGroup && stats.byAgeGroup.length > 0) {
    y = drawSectionTitle(doc, "DISTRIBUCIÓN POR EDAD", y, institution);
    y += 2;

    const headers = ["Grupo de Edad", "Cantidad", "Porcentaje"];
    const colWidths = [60, 40, 40];
    const rows = stats.byAgeGroup.map((item) => [
      item.ageGroup,
      item.count,
      `${item.percentage}%`,
    ]);

    y = drawTable(
      doc,
      headers,
      colWidths,
      rows,
      y,
      institution,
      "ESTADÍSTICAS DE MATRÍCULAS",
      subtitle,
      logoBase64
    );
  }

  drawFooter(doc, institution, 1, 1);

  // Guardar el PDF
  const fileName = `Estadisticas_Matriculas_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// Funciones auxiliares
function getStatusLabel(status) {
  const labels = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    PENDING: "Pendiente",
    CANCELLED: "Cancelado",
  };
  return labels[status] || status;
}

function getEnrollmentTypeLabel(type) {
  const labels = {
    NUEVA: "Nueva",
    REINSCRIPCION: "Reinscripción",
  };
  return labels[type] || type;
}
