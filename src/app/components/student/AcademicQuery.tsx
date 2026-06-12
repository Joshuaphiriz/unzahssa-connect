import { useEffect, useState } from 'react';
import { HelpCircle, Plus, X, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

interface Query { id: string; subject: string; message: string; status: string; adminResponse: string | null; respondedAt: string | null; submittedAt: string; }

const STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open: { label: 'Open', color: '#D4A33D', bg: '#FFFBEB', icon: Clock },
  responded: { label: 'Responded', color: '#2E7D55', bg: '#F0FDF4', icon: CheckCircle },
  closed: { label: 'Closed', color: '#64748B', bg: '#F1F5F9', icon: CheckCircle },
};

export function AcademicQuery() {
  const { token } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Query | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueries = async () => {
    try { setQueries(await api('/queries', {}, token)); } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { if (token) loadQueries(); }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/queries', { method: 'POST', body: JSON.stringify({ subject, message }) }, token);
      setShowModal(false); setSubject(''); setMessage('');
      loadQueries();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Academic Query</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit academic questions and track responses from the team</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: '#1E3A5F' }}>
          <Plus size={15} /> New Query
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : queries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <HelpCircle size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-lg font-semibold">No queries yet</p>
          <p className="text-sm text-muted-foreground mt-1">Submit your first academic question to get support.</p>
          <button onClick={() => setShowModal(true)} className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#1E3A5F' }}>
            Submit a Query
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {queries.map(q => {
            const s = STATUS[q.status] || STATUS.open;
            const Icon = s.icon;
            return (
              <button key={q.id} onClick={() => setSelected(q)} className="w-full text-left bg-white rounded-2xl border border-border p-5 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: s.bg, color: s.color }}>
                        <Icon size={10} /> {s.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{q.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{q.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(q.submittedAt)}</p>
                  </div>
                  {q.adminResponse && (
                    <div className="flex items-center gap-1 text-xs font-medium flex-shrink-0" style={{ color: '#2E7D55' }}>
                      <MessageSquare size={12} /> Response available
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Query detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-bold text-lg pr-4" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>{selected.subject}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-muted flex-shrink-0"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Your Query</p>
                <div className="p-4 rounded-xl bg-muted/50 text-sm leading-relaxed">{selected.message}</div>
                <p className="text-xs text-muted-foreground mt-1.5">{formatDate(selected.submittedAt)}</p>
              </div>

              {selected.adminResponse ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2E7D55' }}>Official Response</p>
                  <div className="p-4 rounded-xl text-sm leading-relaxed border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    {selected.adminResponse}
                  </div>
                  {selected.respondedAt && <p className="text-xs text-muted-foreground mt-1.5">Responded on {formatDate(selected.respondedAt)}</p>}
                </div>
              ) : (
                <div className="p-4 rounded-xl text-sm" style={{ background: '#FFFBEB', color: '#92400E' }}>
                  <Clock size={14} className="inline mr-1.5" /> Your query is being reviewed by the academic affairs team.
                </div>
              )}
            </div>

            <button onClick={() => setSelected(null)} className="w-full mt-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground">Close</button>
          </div>
        </div>
      )}

      {/* New query modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>New Academic Query</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Missing marks — SOC 3201"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                  placeholder="Describe your academic issue in detail…"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
              </div>
              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                The Academic Affairs officer will review your query and respond within 2 working days.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#1E3A5F' }}>
                  {submitting ? 'Submitting…' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
