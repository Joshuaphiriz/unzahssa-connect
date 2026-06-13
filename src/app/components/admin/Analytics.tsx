import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

export function Analytics() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [programmeData, setProgrammeData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([api('/students', {}, token), api('/payments', {}, token)])
      .then(([s, p]) => {
        setStudents(s);
        setPayments(p);
        // Programme breakdown
        const progMap = new Map();
        s.forEach((stu: any) => {
          const prog = stu.programme;
          if (!progMap.has(prog)) progMap.set(prog, { students: 0, affiliated: 0 });
          const entry = progMap.get(prog);
          entry.students++;
          if (stu.affiliationStatus === 'affiliated') entry.affiliated++;
        });
        setProgrammeData(Array.from(progMap.entries()).map(([name, data]) => ({ name, ...data, rate: ((data.affiliated / data.students) * 100).toFixed(0) })));
        // Monthly trend (mock – replace with real date aggregation)
        setMonthlyData([
          { month: 'Jan', open: 2, resolved: 1 },
          { month: 'Feb', open: 3, resolved: 2 },
          { month: 'Mar', open: 1, resolved: 3 },
        ]);
      })
      .catch(console.error);
  }, [token]);

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);
  const statusData = [
    { name: 'Pending', value: payments.filter((p: any) => p.status === 'pending').length },
    { name: 'Approved', value: payments.filter((p: any) => p.status === 'approved').length },
    { name: 'Placed', value: students.filter((s: any) => s.internshipStatus === 'placed').length },
  ];
  const COLORS = ['#D4A33D', '#1E3A5F', '#2E7D55'];

  const downloadCSV = () => {
    const headers = ['Name', 'Student ID', 'Programme', 'Year', 'Affiliation Status'];
    const rows = students.map((s: any) => [s.name, s.studentId, s.programme, s.yearOfStudy, s.affiliationStatus]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Analytics</h1>
      <p className="text-gray-500 mb-6">Detailed breakdown of student and programme metrics.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Total Registrations</p><p className="text-2xl font-bold">{students.length}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Total Affiliated</p><p className="text-2xl font-bold">{students.filter((s: any) => s.affiliationStatus === 'affiliated').length}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Placements Made</p><p className="text-2xl font-bold">{students.filter((s: any) => s.internshipStatus === 'placed').length}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Total Revenue (ZMW)</p><p className="text-2xl font-bold">{totalRevenue}</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Affiliation Status</h2>
          <PieChart width={300} height={300}>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Programme Breakdown</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Programme</th><th>Students</th><th>Affiliated</th><th>Rate</th></tr></thead>
            <tbody>
              {programmeData.map(p => (
                <tr key={p.name} className="border-b"><td className="py-2">{p.name}</td><td>{p.students}</td><td>{p.affiliated}</td><td>{p.rate}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={downloadCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Download CSV Report</button>
      </div>
    </div>
  );
}