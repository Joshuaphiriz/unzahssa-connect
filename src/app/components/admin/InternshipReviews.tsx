import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function InternshipReviews() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = () => {
    api('/internship/all', {}, token)
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchApps();
  }, [token]);

  const updateStatus = async (userId: string, status: string, reviewNotes?: string) => {
    await api(`/internship/${userId}`, { method: 'PUT', body: JSON.stringify({ status, reviewNotes }) }, token);
    fetchApps();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Internship Applications</h1>
      <div className="grid gap-4">
        {applications.map((app: any) => (
          <div key={app.userId} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{app.userName}</h3>
                <p className="text-sm text-gray-600">{app.userEmail} | {app.studentId}</p>
                <p className="text-sm">Programme: {app.programme} | Year: {app.yearOfStudy}</p>
                <p className="text-sm mt-1"><strong>Documents:</strong> {app.documents?.length || 0} uploaded</p>
                {app.reviewNotes && <p className="text-sm text-blue-600 mt-1">Review notes: {app.reviewNotes}</p>}
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  app.status === 'placed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>{app.status}</span>
              </div>
            </div>
            {app.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => updateStatus(app.userId, 'approved', 'Approved for interview')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                <button onClick={() => updateStatus(app.userId, 'rejected', 'Not selected this round')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                <button onClick={() => updateStatus(app.userId, 'placed', 'Placement offered')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Mark Placed</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}