import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function PaymentsManagement() {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    api('/payments', {}, token)
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchPayments();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    await api(`/payments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
    fetchPayments();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Submissions</h1>
      <table className="w-full border">
        <thead><tr className="bg-gray-100"><th>Student</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {payments.map((p: any) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.userName}</td>
              <td className="p-2">ZMW {p.amount}</td>
              <td className="p-2">{p.method}</td>
              <td className="p-2">{p.reference}</td>
              <td className="p-2">{p.status}</td>
              <td className="p-2">
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(p.id, 'approved')} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Approve</button>
                    <button onClick={() => updateStatus(p.id, 'rejected')} className="bg-red-600 text-white px-2 py-1 rounded">Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}