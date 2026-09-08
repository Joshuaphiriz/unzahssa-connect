import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { StudentProfile, Branding } from "./types";

const safe = (s: string) => (s || "Student").replace(/[^\w\s-]/g, "").trim();

/** Render a live preview DOM node to a downloaded PDF, saved under the person's name. */
async function elementToPdf(el: HTMLElement, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  await doc.html(el, {
    x: 24,
    y: 24,
    width: doc.internal.pageSize.getWidth() - 48,
    windowWidth: el.scrollWidth || 820,
    autoPaging: "text",
    html2canvas: { scale: 0.9, useCORS: true, backgroundColor: "#ffffff" },
  });
  doc.save(filename);
}

export function downloadCV(el: HTMLElement, fullName: string) {
  return elementToPdf(el, `${safe(fullName)} CV.pdf`);
}

export function downloadLetter(el: HTMLElement, fullName: string) {
  return elementToPdf(el, `${safe(fullName)} Letter.pdf`);
}

// ── Student registry table ─────────────────────────────────

export function downloadStudentRegistryPdf(rows: StudentProfile[], branding: Branding) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const navy = branding.primary_color || "#1E3A5F";

  doc.setFillColor(navy);
  doc.rect(0, 0, W, 56, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${branding.short_name} — Student Registry`, 40, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generated ${new Date().toLocaleString("en-ZM")}  ·  ${rows.length} students`,
    40,
    42,
  );

  autoTable(doc, {
    startY: 72,
    head: [["Name", "Computer No.", "Programme", "Year", "Affiliation", "Member No.", "Email", "Phone"]],
    body: rows.map((p) => [
      p.full_name,
      p.computer_number || "—",
      p.academic_programme || "—",
      p.year_of_study || "—",
      p.affiliation ? `Yes (${p.affiliation_year ?? "?"})` : "No",
      p.affiliation_number || "—",
      p.email,
      p.phone || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: navy, textColor: "#FFFFFF" },
    alternateRowStyles: { fillColor: "#F3F4F6" },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${branding.short_name}-student-registry-${new Date().toISOString().slice(0, 10)}.pdf`);
}
