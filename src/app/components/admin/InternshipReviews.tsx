import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { FileText, Eye, X } from 'lucide-react';

export function InternshipReviews() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);

  const fetchApps = () => {
    api('/internship/all', {}, token)
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchApps();
  }, [token]);

  const updateStatus = async (userId: string, status: string) => {
    setUpdating(true);
    try {
      await api(`/internship/${userId}`, { method: 'PUT', body: JSON.stringify({ status, reviewNotes: reviewNote }) }, token);
      setReviewNote('');
      setSelectedApp(null);
      fetchApps();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const submittedApps = applications.filter((a: any) => a.status !== 'draft');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Internship Reviews</h1>
      <p className="text-gray-500 mb-6">Submitted internship applications ({submittedApps.length} total).</p>

      <div className="grid md:grid-cols-2 gap-4">
        {submittedApps.map((app: any) => (
          <div key={app.userId} className="border rounded-xl p-4 shadow-sm bg-white cursor-pointer hover:shadow-md transition" onClick={() => setSelectedApp(app)}>
            <h3 className="font-semibold text-lg">{app.userName}</h3>
            <p className="text-sm text-gray-500">{app.studentId} • {app.yearOfStudy} • {app.programme}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <FileText size={14} /> {app.documents?.length || 0} docs
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                app.status === 'approved' ? 'bg-green-100 text-green-700' :
                app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                app.status === 'placed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>{app.status}</span>
            </div>
          </div>
        ))}
        {submittedApps.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400">No internship applications submitted yet.</div>
        )}
      </div>

      {/* Modal for detailed review */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedApp.userName}</h2>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{selectedApp.studentId} • {selectedApp.programme} • {selectedApp.yearOfStudy}</p>
            <p className="mb-2"><strong>Email:</strong> {selectedApp.userEmail}</p>
            
            {/* Documents section */}
            <div className="mb-4">
              <strong>Uploaded Documents:</strong>
              {selectedApp.documents?.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {selectedApp.documents.map((doc: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <FileText size={14} className="text-gray-400" />
                      <span>{doc.name}</span>
                      <button
                        onClick={() => setViewingDoc({ url: doc.url, name: doc.name })}
                        className="ml-auto text-blue-600 hover:underline text-xs flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400 mt-1">No documents uploaded.</p>}
            </div>

            <textarea
              placeholder="Add review notes (optional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-2 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => updateStatus(selectedApp.userId, 'approved')} disabled={updating} className="px-4 py-2 bg-green-600 text-white rounded-lg">Approve</button>
              <button onClick={() => updateStatus(selectedApp.userId, 'pending')} disabled={updating} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Mark Pending</button>
              <button onClick={() => updateStatus(selectedApp.userId, 'placed')} disabled={updating} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Mark Placed</button>
            </div>
          </div>
        </div>
      )}

      {/* Document preview modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">{viewingDoc.name}</h3>
              <button onClick={() => setViewingDoc(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewingDoc.url.endsWith('.pdf') ? (
                <iframe src={viewingDoc.url} className="w-full h-[70vh]" title="PDF Preview" />
              ) : (
                <img src={viewingDoc.url} alt="Document preview" className="max-w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}