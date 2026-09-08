import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { AcademicQueries } from "../../lib/data";
import type { AcademicQuery } from "../../lib/types";
import { HelpCircle, Calendar } from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", cls: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-700" },
};

export function AcademicQueryPage() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<AcademicQuery[]>([]);
  const [form, setForm] = useState({ student_name: user?.name ?? "", student_email: user?.email ?? "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    AcademicQueries.findByUser(user.id).then(list => { if (active) setQueries(list); });
    return () => { active = false; };
  }, [user]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const q = await AcademicQueries.create({
        user_id: user!.id,
        student_name: form.student_name,
        student_email: form.student_email,
        subject: form.subject,
        message: form.message,
        status: "open",
        response: "",
      });
      setQueries(prev => [q, ...prev]);
      setForm(f => ({ ...f, subject: "", message: "" }));
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = form.student_name && form.subject && form.message;
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Academic Query</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit an academic concern or question for the UNZAHSSA Academic Committee.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display)" }}>Submit a Query</h2>
        {submitted && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Your query has been submitted. The Academic Committee will respond within 3–5 working days.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Student Name</label>
              <input value={form.student_name} onChange={set("student_name")} required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Student Email</label>
              <input type="email" value={form.student_email} onChange={set("student_email")} required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject</label>
            <input value={form.subject} onChange={set("subject")} required placeholder="e.g. Course Registration Issue — PS 305"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <textarea rows={4} value={form.message} onChange={set("message")} required placeholder="Describe your issue or question in detail…"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors resize-none" />
          </div>
          <button type="submit" disabled={!canSubmit || submitting}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? "Submitting…" : "Submit Query"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>My Queries</h2>
        {queries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No queries submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map(q => {
              const s = STATUS_STYLES[q.status] ?? STATUS_STYLES.open;
              return (
                <div key={q.id} className="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-foreground">{q.subject}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{q.message}</p>
                  {q.response && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs font-medium text-green-700 mb-1">Response from Academic Committee:</p>
                      <p className="text-sm text-green-800 leading-relaxed">{q.response}</p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" /> Submitted {fmt(q.created_date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
