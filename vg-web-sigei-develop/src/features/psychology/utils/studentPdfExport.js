import jsPDF from "jspdf";

function fmtDate(d) {
     if (!d) return "—";
     try {
          const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
          return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
     } catch { return d; }
}

function trunc(text, max) {
     const s = String(text || "—");
     return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function wrapText(pdf, text, x, y, maxWidth, lineHeight) {
     const lines = pdf.splitTextToSize(String(text || "—"), maxWidth);
     lines.forEach((line, i) => pdf.text(line, x, y + i * lineHeight));
     return y + lines.length * lineHeight;
}

const TYPE_COLORS = {
     INICIAL:     [59, 130, 246],
     SEGUIMIENTO: [139, 92, 246],
     ESPECIAL:    [245, 158, 11],
     DERIVACION:  [239, 68, 68],
};

export async function exportStudentPDF(studentName, evaluations) {
     const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const W = pdf.internal.pageSize.getWidth();
     const H = pdf.internal.pageSize.getHeight();
     const M = 15;
     const CW = W - M * 2;
     const now = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

     const sorted = [...evaluations].sort((a, b) =>
          new Date(a.evaluationDate || 0) - new Date(b.evaluationDate || 0)
     );

     function pageHeader() {
          // Header bar
          pdf.setFillColor(30, 64, 175);
          pdf.rect(0, 0, W, 22, "F");
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 22, W, 2, "F");

          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12); pdf.setFont("helvetica", "bold");
          pdf.text("Historial Psicológico del Estudiante", M, 10);
          pdf.setFontSize(7); pdf.setFont("helvetica", "normal");
          pdf.text("Sistema SIGEI  ·  Bienestar Psicológico Estudiantil", M, 16);
          pdf.text(`Generado: ${now}`, W - M, 16, { align: "right" });
     }

     function pageFooter(pageNum, totalPages) {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(0, H - 10, W, 10, "F");
          pdf.setDrawColor(203, 213, 225);
          pdf.line(0, H - 10, W, H - 10);
          pdf.setTextColor(100, 116, 139); pdf.setFontSize(6.5); pdf.setFont("helvetica", "normal");
          pdf.text("Sistema SIGEI  ·  Institución Educativa Valle Grande", M, H - 4);
          pdf.text(`Página ${pageNum} de ${totalPages}`, W - M, H - 4, { align: "right" });
     }

     // ── Page 1: Student summary ──────────────────────────────────────────────
     pageHeader();
     let y = 30;

     // Student card
     pdf.setFillColor(239, 246, 255);
     pdf.roundedRect(M, y, CW, 28, 3, 3, "F");
     pdf.setFillColor(37, 99, 235);
     pdf.roundedRect(M, y, 4, 28, 2, 2, "F");

     pdf.setTextColor(15, 23, 42);
     pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
     pdf.text(trunc(studentName, 50), M + 10, y + 10);

     pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(71, 85, 105);
     pdf.text(`Total de sesiones: ${sorted.length}`, M + 10, y + 18);
     pdf.text(`Activas: ${sorted.filter(e => e.status === "ACTIVE").length}`, M + 60, y + 18);
     pdf.text(`Con seguimiento: ${sorted.filter(e => e.requiresFollowUp).length}`, M + 100, y + 18);
     if (sorted[0]?.institutionName) pdf.text(`Institución: ${trunc(sorted[0].institutionName, 40)}`, M + 10, y + 24);

     y += 34;

     // Sessions summary table
     pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.setTextColor(15, 23, 42);
     pdf.text("Resumen de Sesiones", M, y);
     y += 5;

     // Table header
     pdf.setFillColor(15, 23, 42);
     pdf.rect(M, y, CW, 7, "F");
     pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.setFont("helvetica", "bold");
     const cols = [
          { h: "#",          x: M + 2,   w: 8  },
          { h: "FECHA",      x: M + 10,  w: 30 },
          { h: "TIPO",       x: M + 40,  w: 28 },
          { h: "EVALUADOR",  x: M + 68,  w: 45 },
          { h: "SEGUIMIENTO",x: M + 113, w: 22 },
          { h: "ESTADO",     x: M + 135, w: 20 },
     ];
     cols.forEach(c => pdf.text(c.h, c.x, y + 5));
     y += 7;

     sorted.forEach((ev, idx) => {
          if (y + 8 > H - 14) {
               pdf.addPage();
               pageHeader();
               y = 30;
          }
          const even = idx % 2 === 0;
          pdf.setFillColor(...(even ? [248, 250, 252] : [255, 255, 255]));
          pdf.rect(M, y, CW, 7, "F");
          pdf.setDrawColor(226, 232, 240);
          pdf.line(M, y + 7, M + CW, y + 7);

          const tc = TYPE_COLORS[ev.evaluationType] || [59, 130, 246];
          pdf.setTextColor(30, 41, 59); pdf.setFontSize(7); pdf.setFont("helvetica", "normal");
          pdf.text(String(idx + 1), cols[0].x, y + 5);
          pdf.text(fmtDate(ev.evaluationDate), cols[1].x, y + 5);

          // type badge
          pdf.setFillColor(...tc.map(v => Math.min(v + 160, 255)));
          pdf.roundedRect(cols[2].x, y + 1, 24, 5, 1.5, 1.5, "F");
          pdf.setTextColor(...tc);
          pdf.setFontSize(6); pdf.setFont("helvetica", "bold");
          pdf.text(trunc(ev.evaluationType, 14), cols[2].x + 12, y + 4.5, { align: "center" });

          pdf.setTextColor(30, 41, 59); pdf.setFontSize(7); pdf.setFont("helvetica", "normal");
          pdf.text(trunc(ev.evaluatorName, 26), cols[3].x, y + 5);
          pdf.text(ev.requiresFollowUp ? "Sí" : "No", cols[4].x, y + 5);

          const isActive = ev.status === "ACTIVE";
          pdf.setFillColor(...(isActive ? [220, 252, 231] : [254, 226, 226]));
          pdf.roundedRect(cols[5].x, y + 1, 16, 5, 1.5, 1.5, "F");
          pdf.setTextColor(...(isActive ? [21, 128, 61] : [185, 28, 28]));
          pdf.setFontSize(6); pdf.setFont("helvetica", "bold");
          pdf.text(isActive ? "Activa" : "Inactiva", cols[5].x + 8, y + 4.5, { align: "center" });

          y += 7;
     });

     // ── Subsequent pages: detail per session ────────────────────────────────
     sorted.forEach((ev, idx) => {
          pdf.addPage();
          pageHeader();
          y = 30;

          // Session header
          const tc = TYPE_COLORS[ev.evaluationType] || [59, 130, 246];
          pdf.setFillColor(...tc.map(v => Math.min(v + 160, 255)));
          pdf.roundedRect(M, y, CW, 14, 3, 3, "F");
          pdf.setFillColor(...tc);
          pdf.roundedRect(M, y, 4, 14, 2, 2, "F");

          pdf.setTextColor(...tc.map(v => Math.max(v - 40, 0)));
          pdf.setFontSize(11); pdf.setFont("helvetica", "bold");
          pdf.text(`Sesión #${idx + 1} — ${ev.evaluationType}`, M + 8, y + 6);
          pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal");
          pdf.text(`Fecha: ${fmtDate(ev.evaluationDate)}  ·  Evaluador: ${trunc(ev.evaluatorName, 35)}  ·  Aula: ${trunc(ev.classroomName, 20)}`, M + 8, y + 12);
          y += 20;

          const section = (title, content) => {
               if (!content) return;
               if (y + 20 > H - 14) { pdf.addPage(); pageHeader(); y = 30; }
               pdf.setFillColor(248, 250, 252);
               pdf.roundedRect(M, y, CW, 6, 2, 2, "F");
               pdf.setTextColor(30, 64, 175); pdf.setFontSize(8); pdf.setFont("helvetica", "bold");
               pdf.text(title, M + 3, y + 4.5);
               y += 8;
               pdf.setTextColor(30, 41, 59); pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal");
               y = wrapText(pdf, content, M + 3, y, CW - 6, 5) + 4;
          };

          if (ev.evaluationReason) section("Motivo de Evaluación", ev.evaluationReason);
          section("Desarrollo Emocional", ev.emotionalDevelopment);
          section("Desarrollo Social", ev.socialDevelopment);
          section("Desarrollo Cognitivo", ev.cognitiveDevelopment);
          section("Desarrollo Motor", ev.motorDevelopment);
          section("Observaciones", ev.observations);
          section("Recomendaciones", ev.recommendations);

          if (ev.requiresFollowUp) {
               if (y + 12 > H - 14) { pdf.addPage(); pageHeader(); y = 30; }
               pdf.setFillColor(254, 243, 199);
               pdf.roundedRect(M, y, CW, 10, 2, 2, "F");
               pdf.setTextColor(180, 83, 9); pdf.setFontSize(7.5); pdf.setFont("helvetica", "bold");
               pdf.text(`⚠ Requiere seguimiento — Frecuencia: ${ev.followUpFrequency || "No especificada"}`, M + 4, y + 6.5);
               y += 14;
          }
     });

     // Add page numbers
     const totalPages = pdf.internal.getNumberOfPages();
     for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pageFooter(i, totalPages);
     }

     const safeName = studentName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
     pdf.save(`historial-${safeName}-${Date.now()}.pdf`);
}
