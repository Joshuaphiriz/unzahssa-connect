import { jsPDF } from "jspdf";
import type { Payment, StudentProfile, Branding } from "./types";

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/apple-touch-icon.jpg");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" });

export async function downloadAffiliationReceipt(
  payment: Payment,
  profile: StudentProfile,
  branding: Branding,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const navy = branding.primary_color || "#1E3A5F";
  const gold = branding.accent_color || "#D4A33D";
  const logo = await loadLogo();

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(navy);
  doc.rect(0, 0, W, 130, "F");
  doc.setFillColor(gold);
  doc.rect(0, 130, W, 4, "F");

  if (logo) {
    try { doc.addImage(logo, "JPEG", 40, 28, 74, 74); } catch { /* ignore */ }
  }
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(branding.short_name || "UNZAHSSA", logo ? 130 : 40, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    doc.splitTextToSize(branding.association_name, W - (logo ? 130 : 40) - 40),
    logo ? 130 : 40,
    74,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(gold);
  doc.text("OFFICIAL AFFILIATION RECEIPT", logo ? 130 : 40, 112);

  // ── Meta row ─────────────────────────────────────────────
  let y = 172;
  doc.setTextColor("#111827");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Receipt No.  ${payment.receipt_number || "—"}`, 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#6B7280");
  doc.text(`Issued ${fmtDate(payment.created_date)}`, W - 40, y, { align: "right" });

  // "PAID" badge
  y += 24;
  doc.setFillColor("#DCFCE7");
  doc.roundedRect(40, y - 13, 62, 20, 4, 4, "F");
  doc.setTextColor("#15803D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAID", 71, y + 1, { align: "center" });

  // ── Details table ────────────────────────────────────────
  y += 40;
  const rows: [string, string][] = [
    ["Member", profile.full_name || payment.student_name],
    ["Computer / Student No.", profile.computer_number || payment.computer_number || "—"],
    ["Programme", profile.academic_programme || "—"],
    ["Membership No.", profile.affiliation_number || "—"],
    ["Academic Year", String(payment.year)],
    ["Fee Type", payment.payment_type],
    ["Amount Paid", `ZMW ${payment.amount.toFixed(2)}`],
    ["Payment Method", payment.payment_method],
    ["Transaction Reference", payment.reference_number || "—"],
  ];

  doc.setFontSize(10.5);
  for (const [label, value] of rows) {
    doc.setDrawColor("#E5E7EB");
    doc.line(40, y + 6, W - 40, y + 6);
    doc.setTextColor("#6B7280");
    doc.setFont("helvetica", "normal");
    doc.text(label, 40, y);
    doc.setTextColor("#111827");
    doc.setFont("helvetica", "bold");
    doc.text(String(value), W - 40, y, { align: "right" });
    y += 26;
  }

  // ── Amount emphasis box ──────────────────────────────────
  y += 14;
  doc.setFillColor(navy);
  doc.roundedRect(40, y, W - 80, 48, 6, 6, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("TOTAL RECEIVED", 58, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`ZMW ${payment.amount.toFixed(2)}`, W - 58, y + 26, { align: "right" });

  // ── Footer ───────────────────────────────────────────────
  const fy = doc.internal.pageSize.getHeight() - 70;
  doc.setDrawColor(gold);
  doc.setLineWidth(1.5);
  doc.line(40, fy, W - 40, fy);
  doc.setLineWidth(1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor("#6B7280");
  doc.text(
    "This receipt confirms payment of the annual UNZAHSSA affiliation fee. Valid for the academic year shown above.",
    40,
    fy + 18,
  );
  doc.text(`${branding.association_name}  ·  ${branding.contact_email}`, 40, fy + 32);

  const safeName = (profile.full_name || payment.student_name || "Student").replace(/[^\w\s-]/g, "").trim();
  doc.save(`${safeName} - UNZAHSSA Affiliation Receipt ${payment.year}.pdf`);
}
