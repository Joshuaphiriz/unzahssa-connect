import React, { useState, useEffect } from "react";
import { StudentDocuments } from "../../../lib/data";
import type { StudentProfile, StudentDocument, InternshipApplication } from "../../../lib/types";
import { Upload, FileText, ExternalLink, Trash2, CheckCircle } from "lucide-react";

const DOC_TYPES = ["CV", "Cover Letter", "NRC", "Transcript", "Certificate", "Recommendation Letter", "Medical", "Other"];
const REQUIRED_DOCS = ["NRC", "Transcript"];

interface Props { profile: StudentProfile; application: InternshipApplication }

export function DocumentsStep({ profile, application }: Props) {
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [docType, setDocType] = useState("CV");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    StudentDocuments.findByApplication(application.id).then(list => { if (active) setDocs(list); });
    return () => { active = false; };
  }, [application.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const doc = await StudentDocuments.upload(
        { id: profile.id, full_name: profile.full_name },
        docType,
        file,
        application.id,
      );
      setDocs(prev => [doc, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    await StudentDocuments.remove(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const uploadedTypes = docs.map(d => d.document_type);
  const allRequired = REQUIRED_DOCS.every(r => uploadedTypes.includes(r));

  return (
    <div>
      <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>Step 3 — Documents</h2>
      <p className="text-muted-foreground text-sm mb-6">Upload supporting documents. NRC and Transcript are required.</p>

      {allRequired && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800 text-sm">All required documents uploaded!</p>
            <p className="text-xs text-green-700 mt-0.5">Your application is complete. The committee will review your documents shortly.</p>
          </div>
        </div>
      )}

      <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
        <p className="text-sm font-medium text-foreground mb-3">Required Documents</p>
        <div className="flex gap-4">
          {REQUIRED_DOCS.map(r => {
            const uploaded = uploadedTypes.includes(r);
            return (
              <div key={r} className={`flex items-center gap-2 text-sm ${uploaded ? "text-green-600" : "text-muted-foreground"}`}>
                <CheckCircle className={`w-4 h-4 ${uploaded ? "text-green-500" : "text-muted-foreground/40"}`} />
                {r}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h3 className="font-medium text-foreground mb-4 text-sm">Upload a Document</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">File (PDF, JPG, PNG, DOC)</label>
            <label className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border-2 border-dashed border-border text-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{uploading ? "Uploading…" : "Choose file"}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} className="sr-only" />
            </label>
          </div>
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>

      {docs.length > 0 ? (
        <div>
          <h3 className="font-medium text-foreground mb-3 text-sm">Uploaded Documents</h3>
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-muted-foreground text-xs">{doc.document_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No documents uploaded yet.</p>
        </div>
      )}
    </div>
  );
}
