import { jsPDF } from "jspdf";
import {
  loadLogoBase64,
  drawHeader,
  drawFooter,
  drawListEntry,
} from "@/core/utils/reportGenerator";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(d));
  } catch { return d; }
}

function estadoLabel(status) {
  const map = {
    FINALIZADO: "Finalizado",
    EN_PROCESO: "En Proceso",
    CANCELADO: "Cancelado",
  };
  return map[status] || status || "—";
}

/**
 * Genera PDF de reporte de evaluaciones diarias con el mismo estilo
 * que el reporte de estudiantes.
 *
 * @param {object} params
 * @param {Array}  params.evaluations  - Lista de evaluaciones del docente
 * @param {object} params.courses      - Mapa courseId → nombre
 * @param {object} params.competencies - Mapa competencyId → nombre
 * @param {object} params.institution  - Datos de la institución
 * @param {object} params.classroom    - Datos del aula
 * @param {object} params.user         - Datos del docente
 */
export async function generateDailyEvaluationsReport({
  evaluations,
  courses = {},
  competencies = {},
  institution = {},
  classroom = null,
  user = {},
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution.logoUrl);
  const pageH = doc.internal.pageSize.getHeight();

  const finalizadas = evaluations.filter(e => e.status === "FINALIZADO").length;
  const enProceso   = evaluations.filter(e => e.status === "EN_PROCESO").length;

  const title    = "Reporte de Evaluaciones Diarias";
  const subtitle = `Total: ${evaluations.length} evaluación(es)  ·  Finalizadas: ${finalizadas}  ·  En proceso: ${enProceso}${classroom ? "  ·  Aula: " + (classroom.classroomName || classroom.name || "—") : ""}`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);
  let pageNum = 1;

  evaluations.forEach((ev, i) => {
    if (y + 16 > pageH - 18) {
      drawFooter(doc, institution, pageNum, "?");
      doc.addPage();
      pageNum++;
      y = drawHeader(doc, institution, title, subtitle, logoBase64);
    }

    const courseName     = courses[ev.courseId] || ev.courseId || "—";
    const competencyId   = ev.details?.[0]?.competencyId;
    const competencyName = competencyId ? (competencies[competencyId] || competencyId) : "—";
    const totalStudents  = ev.details?.length || 0;
    const calificados    = ev.details?.filter(d => d.achievementLevel && d.achievementLevel !== "SIN_CALIFICAR").length || 0;

    const name = courseName;
    const sub  = `Competencia: ${competencyName}  |  Fecha: ${fmtDate(ev.evaluationDate)}`;
    const meta = `Estudiantes: ${calificados}/${totalStudents} calificados`;

    y = drawListEntry(doc, i + 1, name, sub, meta, estadoLabel(ev.status), y, i % 2 !== 0);
  });

  drawFooter(doc, institution, pageNum, pageNum);
  doc.save(`reporte_evaluaciones_diarias_${Date.now()}.pdf`);
}
