import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { FileText, Upload, X, Edit2, Save } from 'lucide-react';

export function InternshipPortal() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [application, setApplication] = useState<any>(null);
  const [form, setForm] = useState({
    programme: '',
    yearOfStudy: '',
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    supervisor: '',
    supervisorEmail: '',
    description: '',
    documents: [] as File[],
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    Promise.all([
      api('/programmes', { method: 'GET' }),
      api('/internship/my', {}, token),
    ]).then(([progs, app]) => {
      setProgrammes(progs || []);
      setApplication(app);
      if (app && app.status !== 'draft') {
        setForm({
          programme: app.programme || '',
          yearOfStudy: app.yearOfStudy || '',
          company: app.company || '',
          position: app.position || '',
          startDate: app.startDate || '',
          endDate: app.endDate || '',
          supervisor: app.supervisor || '',
          supervisorEmail: app.supervisorEmail || '',
          description: app.description || '',
          documents: [],
        });
      }
      setLoading(false);
    }).catch(console.error);
  }, [token]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, submit: true };
      await api('/internship', { method: 'POST', body: JSON.stringify(payload) }, token);
      alert('Application submitted successfully!');
      setIsEditing(false);
      // Refresh application
      const updated = await api('/internship/my', {}, token);
      setApplication(updated);
      setForm(prev => ({ ...prev, documents: [] }));
    } catch (err) {
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setForm({
      programme: application?.programme || '',
      yearOfStudy: application?.yearOfStudy || '',
      company: application?.company || '',
      position: application?.position || '',
      startDate: application?.startDate || '',
      endDate: application?.endDate || '',
      supervisor: application?.supervisor || '',
      supervisorEmail: application?.supervisorEmail || '',
      description: application?.description || '',
      documents: [],
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const hasSubmitted = application && application.status !== 'draft';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Internship Application</h1>

      {hasSubmitted && !isEditing && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">✅ Application submitted on {new Date(application.submittedAt).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600">Status: <span className="font-semibold">{application.status}</span></p>
          <button onClick={handleEdit} className="mt-2 px-4 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
            <Edit2 size={14} /> Edit Application
          </button>
        </div>
      )}

      {isEditing && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          ✏️ Editing your application. Resubmit to update your status.
        </div>
      )}

      {(application?.status === 'draft' || !hasSubmitted || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Programme</label>
              <select value={form.programme} onChange={e => set('programme', e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select programme…</option>
                {programmes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year of Study</label>
              <select value={form.yearOfStudy} onChange={e => set('yearOfStudy', e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select year…</option>
                <option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company/Organisation</label>
              <input type="text" value={form.company} onChange={e => set('company', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input type="text" value={form.position} onChange={e => set('position', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supervisor Name</label>
              <input type="text" value={form.supervisor} onChange={e => set('supervisor', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supervisor Email</label>
              <input type="email" value={form.supervisorEmail} onChange={e => set('supervisorEmail', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Brief description of your internship..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Documents (CV, Cover Letter, etc.)</label>
            <input type="file" multiple onChange={(e) => set('documents', Array.from(e.target.files || []))} className="w-full" />
            {form.documents.length > 0 && (
              <ul className="mt-2 space-y-1">
                {form.documents.map((f, i) => <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><FileText size={14} />{f.name}</li>)}
              </ul>
            )}
          </div>

          <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : isEditing ? 'Update Application' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}