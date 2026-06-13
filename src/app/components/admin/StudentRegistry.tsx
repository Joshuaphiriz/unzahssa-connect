import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { Search } from 'lucide-react';

export function StudentRegistry() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    api('/students', {}, token).then(setStudents).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  const filtered = students.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.includes(search);
    const matchesYear = yearFilter === '' || s.yearOfStudy === yearFilter;
    const matchesStatus = statusFilter === '' || s.affiliationStatus === statusFilter;
    return matchesSearch && matchesYear && matchesStatus;
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Student Registry</h1>
        <p className="text-sm text-gray-500">{filtered.length} of {students.length} students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or programme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-lg text-sm w-80"
          />
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

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm font-medium text-gray-500">
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
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.studentId}</td>
                <td className="px-4 py-3">{s.yearOfStudy}</td>
                <td className="px-4 py-3">{s.programme}</td>
                <td className="px-4 py-3">{s.affiliationStatus === 'affiliated' ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    s.internshipStatus === 'placed' ? 'bg-green-100 text-green-700' :
                    s.internshipStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                    s.internshipStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                  }`}>{s.internshipStatus}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}