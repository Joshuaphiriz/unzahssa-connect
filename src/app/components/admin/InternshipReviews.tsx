import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { FileText } from 'lucide-react';

export function InternshipReviews() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [updating, setUpdating] = useState(false);

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

  // Show ALL applications that have been submitted (not just 3rd/4th year)
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
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-2">{selectedApp.userName}</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedApp.studentId} • {selectedApp.programme} • {selectedApp.yearOfStudy}</p>
            <p className="mb-2"><strong>Email:</strong> {selectedApp.userEmail}</p>
            <p className="mb-4"><strong>Documents:</strong> {selectedApp.documents?.length || 0} uploaded</p>
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
              <button onClick={() => setSelectedApp(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}