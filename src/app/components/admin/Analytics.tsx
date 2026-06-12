import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export function Analytics() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([api('/students', {}, token), api('/payments', {}, token)])
      .then(([s, p]) => { setStudents(s); setPayments(p); })
      .catch(console.error);
  }, [token]);

  const statusData = [
    { name: 'Affiliated', value: students.filter((s: any) => s.affiliationStatus === 'affiliated').length },
    { name: 'Pending', value: students.filter((s: any) => s.affiliationStatus === 'pending').length },
    { name: 'Not Affiliated', value: students.filter((s: any) => s.affiliationStatus === 'not_affiliated').length },
  ];
  const programmeData = students.reduce((acc: any, s: any) => { acc[s.programme] = (acc[s.programme] || 0) + 1; return acc; }, {});
  const programmeChart = Object.entries(programmeData).map(([name, value]) => ({ name, value }));
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);
  const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;

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
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{students.length}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Total Affiliated</p><p className="text-2xl font-bold">{students.filter((s: any) => s.affiliationStatus === 'affiliated').length}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Total Revenue (ZMW)</p><p className="text-2xl font-bold">{totalRevenue}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Pending Payments</p><p className="text-2xl font-bold">{pendingPayments}</p></div>
      </div>
      <button onClick={downloadCSV} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Download CSV Report</button>
      <div className="grid grid-cols-2 gap-6">
        <div><h2 className="text-lg font-semibold">Affiliation Status</h2><PieChart width={300} height={300}><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#1E3A5F', '#D4A33D', '#9CA3AF'][index % 3]} />)}</Pie><Tooltip /></PieChart></div>
        <div><h2 className="text-lg font-semibold">Registrations by Programme</h2><BarChart width={400} height={300} data={programmeChart}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#1E3A5F" /></BarChart></div>
      </div>
    </div>
  );
}