import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export function ProgrammesManagement() {
  const { token } = useAuth();
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProgramme, setNewProgramme] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProgrammes = async () => {
    try {
      const data = await api('/programmes', {}, token);
      setProgrammes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProgrammes();
  }, [token]);

  const addProgramme = async () => {
    if (!newProgramme.trim()) return;
    if (programmes.includes(newProgramme.trim())) {
      setError('Programme already exists');
      return;
    }
    try {
      const updated = [...programmes, newProgramme.trim()].sort();
      await api('/programmes', { method: 'POST', body: JSON.stringify({ programmes: updated }) }, token);
      setProgrammes(updated);
      setNewProgramme('');
      setSuccess('Programme added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add programme');
    }
  };

  const updateProgramme = async (index: number) => {
    if (!editingValue.trim()) return;
    if (programmes.includes(editingValue.trim()) && programmes[index] !== editingValue.trim()) {
      setError('Programme already exists');
      return;
    }
    const updated = [...programmes];
    updated[index] = editingValue.trim();
    const sorted = updated.sort();
    try {
      await api('/programmes', { method: 'POST', body: JSON.stringify({ programmes: sorted }) }, token);
      setProgrammes(sorted);
      setEditingIndex(null);
      setEditingValue('');
      setSuccess('Programme updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update programme');
    }
  };

  const deleteProgramme = async (index: number) => {
    if (!confirm('Remove this programme?')) return;
    const updated = programmes.filter((_, i) => i !== index).sort();
    try {
      await api('/programmes', { method: 'POST', body: JSON.stringify({ programmes: updated }) }, token);
      setProgrammes(updated);
      setSuccess('Programme removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove programme');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Programmes Management</h1>
      <p className="text-gray-500 mb-6">Add, edit, or remove academic programmes available for student registration.</p>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newProgramme}
          onChange={(e) => setNewProgramme(e.target.value)}
          placeholder="e.g., BA Computer Science"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
        />
        <button onClick={addProgramme} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Add Programme
        </button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Programme Name</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programmes.map((prog, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{idx + 1}.</td>
                <td className="px-4 py-3">
                  {editingIndex === idx ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{prog}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingIndex === idx ? (
                    <div className="flex justify-center gap-2">
                      <button onClick={() => updateProgramme(idx)} className="p-1 text-green-600 hover:text-green-800"><Save size={16} /></button>
                      <button onClick={() => { setEditingIndex(null); setEditingValue(''); }} className="p-1 text-gray-500 hover:text-gray-700"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setEditingIndex(idx); setEditingValue(prog); }} className="p-1 text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                      <button onClick={() => deleteProgramme(idx)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {programmes.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400">No programmes added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}