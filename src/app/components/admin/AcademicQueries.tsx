import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { AcademicQueries as QueryStore, AuditLogs } from "../../lib/data";
import type { AcademicQuery } from "../../lib/types";
import { HelpCircle, Send } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
};

export function AcademicQueries() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<AcademicQuery[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const load = () => { void QueryStore.list().then(setQueries); };
  useEffect(load, []);

  const respond = async (q: AcademicQuery, status: AcademicQuery["status"]) => {
    const response = replies[q.id]?.trim();
    if (status === "resolved" && !response) return;
    await QueryStore.update(q.id, { status, ...(response ? { response } : {}) });
    if (user) await AuditLogs.create({
      user_name: user.name, user_email: user.email,
      action: "QUERY_RESPONSE",
      details: `${status === "resolved" ? "Resolved" : "Updated"} academic query from ${q.student_name} — ${q.subject}`,
      page: "/admin/academic-queries",
    });
    setReplies(r => ({ ...r, [q.id]: "" }));
    load();
  };

  const fmt = (d: string) => new Date(d).toLocaleString("en-ZM", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const active = queries.filter(q => q.status !== "resolved");
  const resolved = queries.filter(q => q.status === "resolved");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Academic Queries</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {active.length} awaiting response · {resolved.length} resolved
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-foreground flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
          <span className="w-2 h-2 rounded-full bg-red-500" /> Awaiting Response ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">All caught up.</p>
          </div>
        ) : active.map(q => (
          <div key={q.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{q.subject}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{q.student_name} · {q.student_email} · {fmt(q.created_date)}</p>
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status]}`}>
                {q.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap leading-relaxed">{q.message}</p>
            <textarea rows={3} value={replies[q.id] || ""} onChange={e => setReplies(r => ({ ...r, [q.id]: e.target.value }))}
              placeholder="Type your response…"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => respond(q, "resolved")} disabled={!replies[q.id]?.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Send className="w-3.5 h-3.5" /> Send &amp; Resolve
              </button>
              {q.status === "open" && (
                <button onClick={() => respond(q, "in_progress")}
                  className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">
                  Mark In Progress
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-foreground flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <span className="w-2 h-2 rounded-full bg-green-500" /> Resolved ({resolved.length})
          </h2>
          {resolved.slice(0, 15).map(q => (
            <div key={q.id} className="bg-muted/40 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="font-medium text-foreground text-sm">{q.subject}</h3>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">resolved</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{q.student_name} · {fmt(q.created_date)}</p>
              <p className="text-muted-foreground text-sm mb-2">{q.message}</p>
              {q.response && (
                <div className="p-2.5 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
                  <span className="font-medium">Response: </span>{q.response}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
