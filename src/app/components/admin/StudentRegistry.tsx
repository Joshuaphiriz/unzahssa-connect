import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function StudentRegistry() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const fetchStudents = () => {
    if (!token) return;
    api('/students', {}, token).then(setStudents).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const resetSelected = async () => {
    if (selectedStudents.length === 0) return;
    if (!confirm(`Reset ${selectedStudents.length} student(s) to non‑affiliated?`)) return;
    await api('/admin/reset-affiliation', { method: 'POST', body: JSON.stringify({ studentIds: selectedStudents }) }, token);
    setSelectedStudents([]);
    fetchStudents();
  };

  const resetAll = async () => {
    if (!confirm('⚠️ Reset ALL students to non‑affiliated? This cannot be undone.')) return;
    await api('/admin/reset-all-affiliation', { method: 'POST' }, token);
    fetchStudents();
  };

  const filtered = students.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.includes(search);
    const matchesYear = yearFilter === '' || s.yearOfStudy === yearFilter;
    const matchesStatus = statusFilter === '' || s.affiliationStatus === statusFilter;
    return matchesSearch && matchesYear && matchesStatus;
  });

  const downloadCSV = () => {
    const headers = ['Name', 'Student ID', 'Year', 'Programme', 'Affiliated', 'Internship Status'];
    const rows = filtered.map((s: any) => [s.name, s.studentId, s.yearOfStudy, s.programme, s.affiliationStatus === 'affiliated' ? 'Yes' : 'No', s.internshipStatus]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Student Registry', 14, 10);
    autoTable(doc, {
      head: [['Name', 'Student ID', 'Year', 'Programme', 'Affiliated', 'Status']],
      body: filtered.map((s: any) => [s.name, s.studentId, s.yearOfStudy, s.programme, s.affiliationStatus === 'affiliated' ? 'Yes' : 'No', s.internshipStatus]),
      startY: 20,
    });
    doc.save('students.pdf');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'placed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Student Registry</h1>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm"><Download size={14} /> CSV</button>
          <button onClick={downloadPDF} className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm"><Download size={14} /> PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg text-sm w-80" />
        </div>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Years</option>
          <option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Postgraduate</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Statuses</option>
          <option>affiliated</option><option>pending</option><option>not_affiliated</option>
        </select>
      </div>

      {/* Reset buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={resetSelected} disabled={selectedStudents.length === 0} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm disabled:opacity-50">
          Reset Selected ({selectedStudents.length})
        </button>
        <button onClick={resetAll} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reset All</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm font-medium text-gray-500">
              <th className="px-4 py-3"><input type="checkbox" onChange={(e) => e.target.checked ? setSelectedStudents(students.map((s: any) => s.id)) : setSelectedStudents([])} /></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Affiliated</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s: any) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3"><input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={(e) => e.target.checked ? setSelectedStudents([...selectedStudents, s.id]) : setSelectedStudents(selectedStudents.filter(id => id !== s.id))} /></td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.studentId}</td>
                <td className="px-4 py-3">{s.yearOfStudy}</td>
                <td className="px-4 py-3">{s.programme}</td>
                <td className="px-4 py-3">{s.affiliationStatus === 'affiliated' ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.internshipStatus)}`}>
                    {s.internshipStatus}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}