import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function AcademicQueries() {
  const { token } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchQueries = () => {
    api('/queries', {}, token)
      .then(setQueries)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchQueries();
  }, [token]);

  const handleReply = async (id: string) => {
    const reply = replyText[id];
    if (!reply?.trim()) return;
    setSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      await api(`/queries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'resolved', adminResponse: reply })
      }, token);
      setReplyText(prev => ({ ...prev, [id]: '' }));
      fetchQueries();
    } catch (err) {
      console.error('Failed to submit reply', err);
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const openQueries = queries.filter((q: any) => q.status === 'open');
  const resolvedQueries = queries.filter((q: any) => q.status === 'resolved');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Academic Queries</h1>

      {/* Open Queries */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Awaiting Response ({openQueries.length})
        </h2>
        <div className="space-y-4">
          {openQueries.length === 0 && (
            <div className="text-center text-gray-500 py-8">All caught up! No pending queries.</div>
          )}
          {openQueries.map((q: any) => (
            <div key={q.id} className="border rounded-lg p-5 shadow-sm bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{q.subject}</h3>
                  <p className="text-sm text-gray-500">
                    By {q.userName} ({q.userEmail}) • {q.studentId} • {q.programme}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(q.submittedAt).toLocaleString()}</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
              </div>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{q.message}</p>
              <div className="mt-3">
                <textarea
                  value={replyText[q.id] || ''}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your response here..."
                  rows={3}
                  className="w-full p-3 border rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleReply(q.id)}
                  disabled={!replyText[q.id]?.trim() || submitting[q.id]}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting[q.id] ? 'Sending...' : 'Send Reply & Resolve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolved Queries */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Resolved ({resolvedQueries.length})
        </h2>
        <div className="space-y-3">
          {resolvedQueries.slice(0, 10).map((q: any) => (
            <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{q.subject}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Resolved</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{q.userName} • {new Date(q.submittedAt).toLocaleDateString()}</p>
              <p className="text-gray-600 text-sm mb-2">{q.message}</p>
              {q.adminResponse && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <span className="font-medium">Response:</span> {q.adminResponse}
                </div>
              )}
            </div>
          ))}
          {resolvedQueries.length > 10 && (
            <p className="text-sm text-gray-400 text-center pt-2">+ {resolvedQueries.length - 10} more resolved queries</p>
          )}
        </div>
      </div>
    </div>
  );
}