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

function estadoLabel(tieneBoletaHoy) {
  return tieneBoletaHoy ? "Generada" : "Pendiente";
}

/**
 * Genera un PDF de reporte de libretas de notas con el mismo estilo
 * que el reporte de estudiantes.
 *
 * @param {object} params
 * @param {Array}  params.students            - Lista de estudiantes
 * @param {object} params.classroom           - Datos del aula
 * @param {object} params.institution         - Datos de la institución
 * @param {object} params.boletasPorEstudiante - Mapa studentId → boletas[]
 * @param {number} params.periodNumber        - Número de bimestre
 * @param {number} params.academicYear        - Año académico
 * @param {string} params.periodLabel         - Ej: "1° Bimestre"
 */
export async function generateReportCardsReport({
  students,
  classroom,
  institution = {},
  boletasPorEstudiante = {},
  periodNumber,
  academicYear,
  periodLabel,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution.logoUrl);
  const pageH = doc.internal.pageSize.getHeight();

  const generadas = students.filter(s => {
    const boletas = boletasPorEstudiante[s.id] || [];
    return boletas.some(b => b.periodNumber === periodNumber && b.academicYear === academicYear);
  }).length;

  const title = "Reporte de Libretas de Notas";
  const subtitle = `${periodLabel} ${academicYear}  ·  Aula: ${classroom?.classroomName || "—"}  ·  Total: ${students.length} estudiante(s)  ·  Generadas: ${generadas}  ·  Pendientes: ${students.length - generadas}`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);
  let pageNum = 1;

  students.forEach((s, i) => {
    if (y + 16 > pageH - 18) {
      drawFooter(doc, institution, pageNum, "?");
      doc.addPage();
      pageNum++;
      y = drawHeader(doc, institution, title, subtitle, logoBase64);
    }

    const boletas = boletasPorEstudiante[s.id] || [];
    const boletaActual = boletas.find(b => b.periodNumber === periodNumber && b.academicYear === academicYear);
    const tieneBoletaHoy = !!boletaActual;

    const name = [s.firstName, s.lastName, s.motherLastName].filter(Boolean).join(" ");
    const sub = `CUI: ${s.cui || "—"}  |  Periodo: ${periodLabel} ${academicYear}  |  Aula: ${classroom?.classroomName || "—"}`;
    const meta = boletaActual?.createdAt
      ? `Generada el: ${fmtDate(boletaActual.createdAt)}`
      : "Sin boleta generada aún";

    y = drawListEntry(doc, i + 1, name, sub, meta, estadoLabel(tieneBoletaHoy), y, i % 2 !== 0);
  });

  drawFooter(doc, institution, pageNum, pageNum);
  doc.save(`reporte_libretas_${classroom?.classroomName || "aula"}_${Date.now()}.pdf`);
}
