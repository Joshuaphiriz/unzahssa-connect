import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    affiliated: 0,
    pendingPayments: 0,
    placed: 0,
    revenue: 0,
    queries: 0,
  });
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([api('/students', {}, token), api('/payments', {}, token), api('/queries', {}, token)])
      .then(([studentsData, paymentsData, queries]) => {
        setStudents(studentsData);
        setPayments(paymentsData);
        const affiliated = studentsData.filter((s: any) => s.affiliationStatus === 'affiliated').length;
        const pendingPayments = paymentsData.filter((p: any) => p.status === 'pending').length;
        const placed = studentsData.filter((s: any) => s.internshipStatus === 'placed').length;
        const revenue = paymentsData.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);
        setStats({
          students: studentsData.length,
          affiliated,
          pendingPayments,
          placed,
          revenue,
          queries: queries.length,
        });
        setLoading(false);
      })
      .catch(console.error);
  }, [token]);

  const statusData = [
    { name: 'Pending', value: stats.pendingPayments },
    { name: 'Approved', value: stats.payments?.filter((p: any) => p.status === 'approved').length || 0 },
    { name: 'Placed', value: stats.placed },
  ];
  const COLORS = ['#D4A33D', '#1E3A5F', '#2E7D55'];

  const downloadDashboardCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Students', stats.students],
      ['Affiliated', stats.affiliated],
      ['Placement Rate', `${((stats.placed / stats.students) * 100).toFixed(1)}%`],
      ['Total Revenue (ZMW)', stats.revenue],
      ['Pending Payments', stats.pendingPayments],
      ['Academic Queries', stats.queries],
    ];
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDashboardPDF = () => {
    const doc = new jsPDF();
    doc.text('UNZAHSSA Admin Dashboard', 14, 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 18);
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Students', stats.students.toString()],
        ['Affiliated', stats.affiliated.toString()],
        ['Placement Rate', `${((stats.placed / stats.students) * 100).toFixed(1)}%`],
        ['Total Revenue (ZMW)', stats.revenue.toString()],
        ['Pending Payments', stats.pendingPayments.toString()],
        ['Academic Queries', stats.queries.toString()],
      ],
      startY: 25,
    });
    doc.save(`dashboard_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Admin Dashboard</h1>
          <p className="text-gray-500">Overview of UNZAHSSA portal activity.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadDashboardCSV} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">📄 CSV</button>
          <button onClick={downloadDashboardPDF} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">📑 PDF</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Total Students</p><p className="text-3xl font-bold">{stats.students}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Affiliated</p><p className="text-3xl font-bold">{stats.affiliated}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Placed</p><p className="text-3xl font-bold">{stats.placed}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Placement Rate</p><p className="text-3xl font-bold">{stats.students ? ((stats.placed / stats.students) * 100).toFixed(0) : 0}%</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Confirmed Revenue (ZMW)</p><p className="text-3xl font-bold">{stats.revenue}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Pending Payments</p><p className="text-3xl font-bold">{stats.pendingPayments}</p></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-sm text-gray-500">Academic Queries</p><p className="text-3xl font-bold">{stats.queries}</p></div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mt-4">
        <h2 className="text-lg font-semibold mb-2">Application Status Distribution</h2>
        <PieChart width={400} height={300}>
          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}