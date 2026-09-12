import { useState, useEffect } from "react";
import { StudentProfiles, StudentAccounts, AuditLogs } from "../../lib/data";
import { downloadStudentRegistryPdf } from "../../lib/pdf";
import { useBranding } from "../shared/BrandingContext";
import { useAuth } from "../../lib/auth";
import type { StudentProfile } from "../../lib/types";
import { Search, X, Download, FileText, Eye, Trash2 } from "lucide-react";

function StudentDialog({ profile, onClose }: { profile: StudentProfile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Student Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            ["Full Name", profile.full_name], ["Computer No.", profile.computer_number],
            ["Year of Study", profile.year_of_study], ["Programme", profile.academic_programme],
            ["Email", profile.email], ["Phone", profile.phone],
            ["Affiliation", profile.affiliation ? `Yes (${profile.affiliation_year ?? "?"})` : "No"],
            ["Membership No.", profile.affiliation_number || "—"],
          ].map(([k, v]) => (
            <div key={k} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-sm font-medium text-foreground break-all">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentRegistry() {
  const { branding } = useBranding();
  const { user, hasAdminPage } = useAuth();
  const canDelete = hasAdminPage("users");
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [affiliationFilter, setAffiliationFilter] = useState("");
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;
    StudentProfiles.list().then(list => { if (active) setProfiles(list); });
    return () => { active = false; };
  }, []);

  const removeStudent = async (p: StudentProfile) => {
    const confirmed = confirm(
      `Permanently delete ${p.full_name}'s account?\n\nThis removes their login, profile, payments, documents and internship applications. This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeletingId(p.id);
    setDeleteError("");
    try {
      await StudentAccounts.delete(p.id);
      if (user) await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "STUDENT_DELETED", details: `Deleted student account for ${p.full_name} (${p.email})`,
        page: "/admin/registry",
      });
      setProfiles(prev => prev.filter(x => x.id !== p.id));
      setSelected(sel => (sel?.id === p.id ? null : sel));
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete the student account.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.full_name.toLowerCase().includes(q) || p.computer_number.toLowerCase().includes(q) || p.academic_programme.toLowerCase().includes(q);
    const matchYear = !yearFilter || p.year_of_study === yearFilter;
    const matchAff = affiliationFilter === "" || (affiliationFilter === "yes" ? p.affiliation : !p.affiliation);
    return matchSearch && matchYear && matchAff;
  });

  const downloadCSV = () => {
    const headers = ["Name", "Computer No.", "Year", "Programme", "Affiliation", "Member No.", "Email", "Phone"];
    const rows = filtered.map(p => [
      p.full_name, p.computer_number, p.year_of_study, p.academic_programme,
      p.affiliation ? `Yes (${p.affiliation_year ?? ""})` : "No", p.affiliation_number || "", p.email, p.phone,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "students.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {selected && <StudentDialog profile={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Student Registry</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} of {profiles.length} students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => downloadStudentRegistryPdf(filtered, branding)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
            <FileText className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or programme…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 text-sm transition-colors" />
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors">
          <option value="">All Years</option>
          {["1st Year","2nd Year","3rd Year","4th Year","5th Year","Postgraduate"].map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={affiliationFilter} onChange={e => setAffiliationFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors">
          <option value="">All</option>
          <option value="yes">Affiliated</option>
          <option value="no">Not affiliated</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Computer No.</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Programme</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Affiliated</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No students found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.computer_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.year_of_study}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate" title={p.academic_programme}>{p.academic_programme}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.affiliation ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {p.affiliation ? `Yes · ${p.affiliation_year ?? ""}` : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      <button onClick={() => setSelected(p)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button onClick={() => removeStudent(p)} disabled={deletingId === p.id}
                          title="Delete student account and everything belonging to it"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
