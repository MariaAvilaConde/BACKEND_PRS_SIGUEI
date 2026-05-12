import { jsPDF } from "jspdf";
import {
     drawHeader,
     drawFooter,
     drawTable,
} from "@/core/utils/reportGenerator";
import {
     INCIDENT_STATUS_LABELS,
     INCIDENT_TYPE_LABELS,
     SEVERITY_LEVEL_LABELS,
} from "../models/disciplineModel";

function statusLabel(s) {
     return INCIDENT_STATUS_LABELS[s] || s || "—";
}

function typeLabel(t) {
     return INCIDENT_TYPE_LABELS[t] || t || "—";
}

function severityLabel(s) {
     return SEVERITY_LEVEL_LABELS[s] || s || "—";
}

function fmtDate(d) {
     if (!d) return "—";
     try {
          return new Intl.DateTimeFormat("es-PE", {
               day: "2-digit",
               month: "2-digit",
               year: "numeric",
          }).format(new Date(`${d}T00:00:00`));
     } catch {
          return d;
     }
}

function sanitizeCsvValue(value) {
     const raw = value == null ? "" : String(value);
     return `"${raw.replace(/"/g, '""')}"`;
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

function truncate(text, maxLen = 60) {
     if (!text) return "—";
     return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

// ── PDF Report ────────────────────────────────────────────────────────────────

export async function generateIncidentsListReport(incidents, institution = {}) {
     const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

     const title = `Reporte de Incidencias Disciplinarias`;
     const subtitle = `Total: ${incidents.length} incidencia(s) registrada(s)`;

     const y = drawHeader(doc, institution, title, subtitle, null);

     const headers = ["#", "Fecha", "Tipo", "Severidad", "Alumno", "Ubicación", "Descripción", "Reportado", "Estado"];
     const colWidths = [8, 20, 26, 22, 42, 30, 58, 30, 20];

     const rows = incidents.map((inc, i) => [
          String(i + 1),
          fmtDate(inc.incidentDate),
          typeLabel(inc.incidentType),
          severityLabel(inc.severityLevel),
          inc.studentName || inc.studentId || "—",
          truncate(inc.location, 30),
          truncate(inc.description),
          inc.reportedBy || "—",
          statusLabel(inc.status),
     ]);

     drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, null);

     doc.save(`reporte_incidencias_${buildFileStamp()}.pdf`);
}

// ── CSV Report ────────────────────────────────────────────────────────────────

export function generateIncidentsCsvReport(incidents) {
     const lines = [];

     lines.push("Fecha,Hora,Tipo,Severidad,Estado,Alumno,Ubicacion,Reportado por,Responsable,Descripcion");

     incidents.forEach((inc) => {
          lines.push(
               [
                    sanitizeCsvValue(fmtDate(inc.incidentDate)),
                    sanitizeCsvValue(inc.incidentTime || ""),
                    sanitizeCsvValue(typeLabel(inc.incidentType)),
                    sanitizeCsvValue(severityLabel(inc.severityLevel)),
                    sanitizeCsvValue(statusLabel(inc.status)),
                    sanitizeCsvValue(inc.studentName || inc.studentId || ""),
                    sanitizeCsvValue(inc.location || ""),
                    sanitizeCsvValue(inc.reportedBy || ""),
                    sanitizeCsvValue(inc.resolvedBy || "—"),
                    sanitizeCsvValue(inc.description || ""),
               ].join(",")
          );
     });

     const csv = lines.join("\n");
     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
     downloadBlob(blob, `reporte_incidencias_${buildFileStamp()}.csv`);
}

// ── Legacy wrapper (backward compatibility) ──────────────────────────────────

export const incidentReportService = {
     async generatePdfReport({ incidents, institution }) {
          await generateIncidentsListReport(incidents, institution);
     },
     generateCsvReport({ incidents }) {
          generateIncidentsCsvReport(incidents);
     },
};