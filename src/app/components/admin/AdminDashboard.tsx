import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

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

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api('/students', {}, token),
      api('/payments', {}, token),
      api('/queries', {}, token),
    ]).then(([students, payments, queries]) => {
      const affiliated = students.filter((s: any) => s.affiliationStatus === 'affiliated').length;
      const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
      const placed = students.filter((s: any) => s.internshipStatus === 'placed').length;
      const revenue = payments.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);
      setStats({
        students: students.length,
        affiliated,
        pendingPayments,
        placed,
        revenue,
        queries: queries.length,
      });
    }).catch(console.error);
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{stats.students}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Affiliated</p><p className="text-2xl font-bold">{stats.affiliated}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Pending Payments</p><p className="text-2xl font-bold">{stats.pendingPayments}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Placed Students</p><p className="text-2xl font-bold">{stats.placed}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Total Revenue (ZMW)</p><p className="text-2xl font-bold">{stats.revenue}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-500">Academic Queries</p><p className="text-2xl font-bold">{stats.queries}</p></div>
      </div>
    </div>
  );
}