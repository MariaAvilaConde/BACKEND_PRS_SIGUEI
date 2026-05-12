import { jsPDF } from "jspdf";
import {
     drawHeader,
     drawFooter,
     drawTable,
} from "@/core/utils/reportGenerator";
import { CLASSROOM_STATUS_LABELS } from "../models/classroomModel";

function statusLabel(s) {
     return CLASSROOM_STATUS_LABELS[s] || s || "—";
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

// ── PDF Report ────────────────────────────────────────────────────────────────

export async function generateClassroomsListReport(classrooms, institution = {}) {
     const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

     const title = `Reporte de Aulas`;
     const subtitle = `Total: ${classrooms.length} aula(s) registrada(s)`;

     const y = drawHeader(doc, institution, title, subtitle, null);

     const headers = ["#", "Nombre del Aula", "Edad/Grado", "Capacidad", "Estado"];
     const colWidths = [14, 110, 40, 32, 36];

     const rows = classrooms.map((cls, i) => [
          String(i + 1),
          truncate(cls.name || "Sin nombre", 50),
          cls.age || "—",
          String(cls.capacity || "—"),
          statusLabel(cls.status),
     ]);

     drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, null);

     doc.save(`reporte_aulas_${buildFileStamp()}.pdf`);
}

// ── Legacy wrapper (backward compatibility) ──────────────────────────────────

export const classroomReportService = {
     async generatePdfReport({ classrooms, institution }) {
          await generateClassroomsListReport(classrooms, institution);
     },
};