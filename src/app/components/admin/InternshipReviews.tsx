import { useState, useEffect } from "react";
import { InternshipApplications, StudentDocuments, AuditLogs } from "../../lib/data";
import { useAuth } from "../../lib/auth";
import type { InternshipApplication, StudentDocument, ApplicationStatus } from "../../lib/types";
import { X, FileText, Download, Plus, ChevronDown } from "lucide-react";

const STATUS_OPTIONS: ApplicationStatus[] = ["pending", "under_review", "approved", "placed", "rejected"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  under_review: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-purple-100 text-purple-700 border-purple-200",
  placed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

function ReviewDialog({ app, onClose, onUpdated }: {
  app: InternshipApplication;
  onClose: () => void;
  onUpdated: (a: InternshipApplication) => void;
}) {
  const { user } = useAuth();
  const [a, setA] = useState(app);
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [noteText, setNoteText] = useState("");
  const [placement, setPlacement] = useState({ org: a.placement_organisation, date: a.placement_date });
  const student = a.student;

  useEffect(() => {
    let active = true;
    StudentDocuments.findByApplication(app.id, true).then(list => { if (active) setDocs(list); });
    return () => { active = false; };
  }, [app.id]);

  const save = async (patch: Partial<InternshipApplication>, action: string, details: string) => {
    const updated = await InternshipApplications.update(a.id, patch);
    if (user) await AuditLogs.create({ user_name: user.name, user_email: user.email, action, details, page: "/admin/reviews" });
    setA(updated);
    onUpdated(updated);
  };

  const updateStatus = (status: ApplicationStatus) =>
    save({ status }, "APP_STATUS_UPDATE", `${student?.full_name ?? "Applicant"} → ${status}`);

  const savePlacement = () =>
    save({ placement_organisation: placement.org, placement_date: placement.date }, "APP_PLACEMENT", `${student?.full_name ?? "Applicant"} placed at ${placement.org}`);

  const addNote = () => {
    if (!noteText.trim()) return;
    const notes = [...a.review_notes, { id: Date.now().toString(), text: noteText, author: user!.name, date: new Date().toISOString() }];
    save({ review_notes: notes }, "APP_NOTE", `Note on ${student?.full_name ?? "applicant"}`);
    setNoteText("");
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{student?.full_name ?? "Applicant"}</h3>
            <p className="text-sm text-muted-foreground">
              {student?.computer_number} · {student?.academic_programme} · {student?.year_of_study}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Application Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${a.status === s ? STATUS_STYLES[s] + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground border-transparent hover:bg-border"}`}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {a.target_organisations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Target Organisations</p>
              <div className="flex flex-wrap gap-2">
                {a.target_organisations.map(o => (
                  <span key={o} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{o}</span>
                ))}
              </div>
            </div>
          )}

          {(a.status === "placed" || a.status === "approved") && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Placement Details</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={placement.org} onChange={e => setPlacement(p => ({ ...p, org: e.target.value }))} placeholder="Organisation"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                <input type="date" value={placement.date} onChange={e => setPlacement(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              </div>
              <button onClick={savePlacement} className="mt-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                Save Placement
              </button>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Documents ({docs.length})</p>
            {docs.length === 0 ? (
              <p className="text-muted-foreground text-xs">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{doc.file_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{doc.document_type}</span>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Review Notes ({a.review_notes.length})</p>
            <div className="space-y-2 mb-3">
              {a.review_notes.map(n => (
                <div key={n.id} className="p-3 bg-muted rounded-lg border border-border">
                  <p className="text-foreground text-sm">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.author} · {fmt(n.date)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea rows={2} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a review note…"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition-colors" />
              <button onClick={addNote} className="self-end px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InternshipReviews() {
  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<InternshipApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([InternshipApplications.list(), StudentDocuments.list()]).then(([a, docs]) => {
      if (!active) return;
      setApps(a);
      const counts: Record<string, number> = {};
      for (const d of docs) if (d.application_id) counts[d.application_id] = (counts[d.application_id] ?? 0) + 1;
      setDocCounts(counts);
    });
    return () => { active = false; };
  }, []);

  const onUpdated = (updated: InternshipApplication) => {
    setApps(prev => prev.map(a => (a.id === updated.id ? { ...updated, student: a.student ?? updated.student } : a)));
    setSelected(s => (s && s.id === updated.id ? updated : s));
  };

  const filtered = statusFilter ? apps.filter(a => a.status === statusFilter) : apps;

  return (
    <div className="space-y-6">
      {selected && <ReviewDialog app={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} />}

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Internship Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">{apps.length} applications submitted by students.</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => (
          <button key={a.id} onClick={() => setSelected(a)}
            className="text-left bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">{a.student?.full_name?.[0] ?? "?"}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[a.status] ?? "bg-muted text-muted-foreground"}`}>
                {a.status.replace("_", " ")}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{a.student?.full_name ?? "Applicant"}</h3>
            <p className="text-muted-foreground text-xs mb-1">{a.student?.computer_number}</p>
            <p className="text-muted-foreground text-xs">{a.student?.year_of_study} · {a.student?.academic_programme}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span>{docCounts[a.id] ?? 0} doc{(docCounts[a.id] ?? 0) !== 1 ? "s" : ""}</span>
              <span>{a.review_notes.length} note{a.review_notes.length !== 1 ? "s" : ""}</span>
              <span className="ml-auto flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Review <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No applications{statusFilter ? ` with status "${statusFilter}"` : ""} yet.</p>
        </div>
      )}
    </div>
  );
}
