import { jsPDF } from "jspdf";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "../models/eventModel";
import {
     loadLogoBase64,
     drawHeader,
     drawFooter,
     drawTable,
     drawSectionTitle,
     drawField,
     drawBadge,
} from "@/core/utils/reportGenerator";

function formatDateValue(value) {
     if (!value) return "";
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return "";
     return new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
     }).format(date);
}

function sanitizeCsvValue(value) {
     const raw = value == null ? "" : String(value);
     return `"${raw.replace(/"/g, '""')}"`;
}

function getTypeLabel(type) {
     return EVENT_TYPE_LABELS[type] || type || "Sin tipo";
}

function getStatusLabel(status) {
     return EVENT_STATUS_LABELS[status] || status || "Sin estado";
}

function buildSummary(events) {
     const byType = events.reduce((acc, event) => {
          const key = getTypeLabel(event.eventType);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
     }, {});

     const byStatus = events.reduce((acc, event) => {
          const key = getStatusLabel(event.status);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
     }, {});

     return {
          total: events.length,
          byType,
          byStatus,
     };
}

function downloadBlob(blob, fileName) {
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = fileName;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
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

function addPdfLine(doc, text, yRef, options = {}) {
     const margin = 40;
     const pageHeight = doc.internal.pageSize.getHeight();
     const maxWidth = options.maxWidth || doc.internal.pageSize.getWidth() - margin * 2;
     const lines = doc.splitTextToSize(text, maxWidth);

     if (yRef.value + lines.length * 14 > pageHeight - 40) {
          doc.addPage();
          yRef.value = 40;
     }

     doc.text(lines, margin, yRef.value);
     yRef.value += lines.length * 14 + 4;
}

function mapEventRow(event) {
     const startDate = formatDateValue(event.startDate);
     const endDate = formatDateValue(event.endDate);
     const dateRange = endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate;

     return {
          title: event.title || "Sin titulo",
          description: event.description || "",
          dateRange,
          type: getTypeLabel(event.eventType),
          status: getStatusLabel(event.status),
          flags: [
               event.isHoliday ? "Feriado" : "",
               event.affectsClasses ? "Afecta clases" : "",
               event.isNational ? "Nacional" : "",
               event.isRecurring ? "Recurrente" : "",
          ].filter(Boolean).join(", "),
     };
}

export const eventReportService = {
     generateCsvReport({ events, calendar, filters, generatedBy }) {
          const rows = events.map(mapEventRow);
          const summary = buildSummary(events);
          const generatedAt = new Date().toLocaleString("es-PE");

          const headerLines = [
               ["Reporte", "Eventos por calendario"],
               ["Calendario", `Anio ${calendar?.academicYear || "N/A"}`],
               ["Rango calendario", `${formatDateValue(calendar?.startDate)} - ${formatDateValue(calendar?.endDate)}`],
               ["Generado por", generatedBy || "Sistema"],
               ["Fecha de generacion", generatedAt],
               ["Filtro estado", filters?.statusFilter || "Todos"],
               ["Filtro tipo", filters?.typeFilter || "Todos"],
               ["Busqueda", filters?.searchTerm || "Sin busqueda"],
               ["Total eventos", String(summary.total)],
          ];

          const typeSummary = Object.entries(summary.byType).map(([type, count]) => ["Tipo", `${type}: ${count}`]);
          const statusSummary = Object.entries(summary.byStatus).map(([status, count]) => ["Estado", `${status}: ${count}`]);

          const lines = [];
          lines.push("METADATOS");
          lines.push("Campo,Valor");

          headerLines.forEach(([field, value]) => {
               lines.push(`${sanitizeCsvValue(field)},${sanitizeCsvValue(value)}`);
          });

          typeSummary.forEach(([field, value]) => {
               lines.push(`${sanitizeCsvValue(field)},${sanitizeCsvValue(value)}`);
          });

          statusSummary.forEach(([field, value]) => {
               lines.push(`${sanitizeCsvValue(field)},${sanitizeCsvValue(value)}`);
          });

          lines.push("");
          lines.push("DETALLE_DE_EVENTOS");
          lines.push("Titulo,Descripcion,Fechas,Tipo,Estado,Caracteristicas");

          rows.forEach((row) => {
               lines.push(
                    [
                         sanitizeCsvValue(row.title),
                         sanitizeCsvValue(row.description),
                         sanitizeCsvValue(row.dateRange),
                         sanitizeCsvValue(row.type),
                         sanitizeCsvValue(row.status),
                         sanitizeCsvValue(row.flags || "-"),
                    ].join(",")
               );
          });

          const csv = lines.join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const fileName = `reporte_eventos_${calendar?.academicYear || "general"}_${buildFileStamp()}.csv`;
          downloadBlob(blob, fileName);
     },

     generatePdfReport({ events, calendar, institution, generatedBy }) {
          const rows = events.map(mapEventRow);
          const summary = buildSummary(events);

          (async () => {
               try {
                    // Cargar logo si existe
                    let logoBase64 = null;
                    if (institution?.logoUrl) {
                         logoBase64 = await loadLogoBase64(institution.logoUrl);
                    }

                    // Crear documento
                    const doc = new jsPDF({ unit: "mm", format: "a4" });

                    // Dibujar encabezado
                    let y = drawHeader(
                         doc,
                         institution || {},
                         "Reporte de Eventos",
                         `Calendario Académico: ${calendar?.academicYear || "N/A"}`,
                         logoBase64
                    );

                    // Sección de metadatos
                    y = drawSectionTitle(doc, "INFORMACIÓN DEL REPORTE", y, institution);
                    y += 2;

                    drawField(doc, "Rango", `${formatDateValue(calendar?.startDate)} - ${formatDateValue(calendar?.endDate)}`, 15, y);
                    y += 6;
                    drawField(doc, "Generado por", generatedBy || "Sistema", 15, y);
                    y += 6;
                    drawField(doc, "Total eventos", String(summary.total), 15, y);
                    y += 10;

                    // Resumen por tipo
                    if (Object.keys(summary.byType).length > 0) {
                         y = drawSectionTitle(doc, "RESUMEN POR TIPO", y, institution);
                         Object.entries(summary.byType).forEach(([type, count]) => {
                              drawField(doc, type, String(count), 15, y);
                              y += 5;
                         });
                         y += 5;
                    }

                    // Tabla de eventos
                    const headers = ["#", "Título", "Fechas", "Tipo", "Estado", "Características"];
                    const colWidths = [8, 50, 40, 30, 25, 40];

                    const tableRows = rows.map((row, idx) => [
                         String(idx + 1),
                         row.title,
                         row.dateRange,
                         row.type,
                         row.status,
                         row.flags || "-",
                    ]);

                    y = drawSectionTitle(doc, "DETALLE DE EVENTOS", y, institution);

                    drawTable(
                         doc,
                         headers,
                         colWidths,
                         tableRows,
                         y,
                         institution || {},
                         "Reporte de Eventos",
                         `Calendario Académico: ${calendar?.academicYear || "N/A"}`,
                         logoBase64
                    );

                    // Guardar PDF
                    const fileName = `reporte_eventos_${calendar?.academicYear || "general"}_${buildFileStamp()}.pdf`;
                    doc.save(fileName);
               } catch (error) {
                    console.error("Error al generar PDF avanzado:", error);
                    // Fallback al método anterior
                    generatePdfReportFallback({ events, calendar, generatedBy });
               }
          })();
     },

     // Método fallback por si falla el avanzado
     generatePdfReportFallback({ events, calendar, generatedBy }) {
          const rows = events.map(mapEventRow);
          const summary = buildSummary(events);
          const generatedAt = new Date().toLocaleString("es-PE");

          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const yRef = { value: 48 };

          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          addPdfLine(doc, "Reporte de Eventos", yRef);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          addPdfLine(doc, `Calendario: Anio ${calendar?.academicYear || "N/A"}`, yRef);
          addPdfLine(doc, `Rango: ${formatDateValue(calendar?.startDate)} - ${formatDateValue(calendar?.endDate)}`, yRef);
          addPdfLine(doc, `Generado por: ${generatedBy || "Sistema"}`, yRef);
          addPdfLine(doc, `Fecha de generacion: ${generatedAt}`, yRef);
          addPdfLine(doc, `Total eventos: ${summary.total}`, yRef);

          addPdfLine(doc, "", yRef);
          doc.setFont("helvetica", "bold");
          addPdfLine(doc, "Resumen por tipo:", yRef);
          doc.setFont("helvetica", "normal");
          Object.entries(summary.byType).forEach(([type, count]) => {
               addPdfLine(doc, `- ${type}: ${count}`, yRef);
          });

          doc.setFont("helvetica", "bold");
          addPdfLine(doc, "Resumen por estado:", yRef);
          doc.setFont("helvetica", "normal");
          Object.entries(summary.byStatus).forEach(([status, count]) => {
               addPdfLine(doc, `- ${status}: ${count}`, yRef);
          });

          addPdfLine(doc, "", yRef);
          doc.setFont("helvetica", "bold");
          addPdfLine(doc, "Detalle de eventos:", yRef);
          doc.setFont("helvetica", "normal");

          rows.forEach((row, index) => {
               addPdfLine(doc, `${index + 1}. ${row.title}`, yRef);
               addPdfLine(doc, `   Fecha: ${row.dateRange}`, yRef);
               addPdfLine(doc, `   Tipo: ${row.type} | Estado: ${row.status}`, yRef);
               if (row.flags) addPdfLine(doc, `   Caracteristicas: ${row.flags}`, yRef);
               if (row.description) addPdfLine(doc, `   Descripcion: ${row.description}`, yRef, { maxWidth: 500 });
               addPdfLine(doc, "", yRef);
          });

          const fileName = `reporte_eventos_${calendar?.academicYear || "general"}_${buildFileStamp()}.pdf`;
          doc.save(fileName);
     },
};
