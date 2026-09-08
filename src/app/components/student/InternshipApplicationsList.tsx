import React from "react";
import type { InternshipApplication } from "../../lib/types";
import { Plus, FileText, Trash2, ChevronRight } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-purple-100 text-purple-700",
  placed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

interface Props {
  applications: InternshipApplication[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  creating: boolean;
}

export function InternshipApplicationsList({ applications, onOpen, onCreate, onDelete, creating }: Props) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Internship Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create an application for each placement you're pursuing. Past applications stay here for your records.
          </p>
        </div>
        <button onClick={onCreate} disabled={creating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> {creating ? "Creating…" : "New Application"}
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No applications yet. Start one when you're ready to apply.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {applications.map((a, i) => {
            const s = STATUS_STYLES[a.status] ?? "bg-muted text-muted-foreground";
            return (
              <div key={a.id} onClick={() => onOpen(a.id)} role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter") onOpen(a.id); }}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">
                    Application #{applications.length - i}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s}`}>{a.status.replace("_", " ")}</span>
                </div>
                <p className="text-muted-foreground text-xs mb-1">
                  {a.target_organisations.length
                    ? a.target_organisations.slice(0, 3).join(", ") + (a.target_organisations.length > 3 ? "…" : "")
                    : "No target organisations yet"}
                </p>
                <p className="text-muted-foreground text-xs mb-3">
                  {a.cv_data ? "CV started" : "CV not started"} · {a.letter_data ? "letter started" : "no letter"}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>Created {fmt(a.created_date)}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); if (confirm("Delete this application?")) onDelete(a.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
