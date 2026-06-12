import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function StudentRegistry() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ year: '', status: '', search: '' });

  useEffect(() => {
    if (!token) return;
    api('/students', {}, token).then(setStudents).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  const filtered = students.filter((s: any) =>
    (filter.year === '' || s.yearOfStudy === filter.year) &&
    (filter.status === '' || s.affiliationStatus === filter.status) &&
    (filter.search === '' || s.name.toLowerCase().includes(filter.search.toLowerCase()) || s.studentId.includes(filter.search))
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Registry</h1>
      <div className="flex gap-4 mb-4">
        <input placeholder="Search name/ID" className="border p-2 rounded" onChange={e => setFilter({...filter, search: e.target.value})} />
        <select onChange={e => setFilter({...filter, year: e.target.value})}><option value="">All Years</option><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option></select>
        <select onChange={e => setFilter({...filter, status: e.target.value})}><option value="">All Statuses</option><option>affiliated</option><option>pending</option><option>not_affiliated</option></select>
      </div>
      <table className="w-full border">
        <thead><tr className="bg-gray-100"><th>Name</th><th>Student ID</th><th>Year</th><th>Programme</th><th>Affiliated</th><th>Internship Status</th></tr></thead>
        <tbody>
          {filtered.map((s: any) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.studentId}</td>
              <td className="p-2">{s.yearOfStudy}</td>
              <td className="p-2">{s.programme}</td>
              <td className="p-2">{s.affiliationStatus}</td>
              <td className="p-2">{s.internshipStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}