import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

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
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([api('/students', {}, token), api('/payments', {}, token), api('/queries', {}, token)])
      .then(([students, payments, queries]) => {
        const affiliated = students.filter((s: any) => s.affiliationStatus === 'affiliated').length;
        const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
        const placed = students.filter((s: any) => s.internshipStatus === 'placed').length;
        const revenue = payments.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);
        const placementRate = students.length ? ((placed / students.length) * 100).toFixed(0) : 0;
        setStats({
          students: students.length,
          affiliated,
          pendingPayments,
          placed,
          revenue,
          queries: queries.length,
        });
        // Chart data for application status distribution (mock for now – replace with real data if available)
        setStatusData([
          { name: 'Pending', value: pendingPayments },
          { name: 'Approved', value: payments.filter((p: any) => p.status === 'approved').length },
          { name: 'Placed', value: placed },
        ]);
      })
      .catch(console.error);
  }, [token]);

  const COLORS = ['#D4A33D', '#1E3A5F', '#2E7D55'];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Admin Dashboard</h1>
      <p className="text-gray-500 mb-6">Overview of UNZAHSSA portal activity.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-3xl font-bold">{stats.students}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Affiliated</p>
          <p className="text-3xl font-bold">{stats.affiliated}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Placed</p>
          <p className="text-3xl font-bold">{stats.placed}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Placement Rate</p>
          <p className="text-3xl font-bold">{stats.students ? ((stats.placed / stats.students) * 100).toFixed(0) : 0}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Confirmed Revenue (ZMW)</p>
          <p className="text-3xl font-bold">{stats.revenue}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-3xl font-bold">{stats.pendingPayments}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Academic Queries</p>
          <p className="text-3xl font-bold">{stats.queries}</p>
        </div>
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