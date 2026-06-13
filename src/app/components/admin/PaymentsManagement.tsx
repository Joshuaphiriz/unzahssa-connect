import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function PaymentsManagement() {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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
    setProcessing(id);
    try {
      await api(`/payments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      if (status === 'approved') {
        alert('Receipt sent to student email (demo).');
      }
      fetchPayments();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Submissions</h1>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
             </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{p.userName}</td>
                <td className="px-4 py-3">ZMW {p.amount}</td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3">{p.reference}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' :
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <button onClick={() => updateStatus(p.id, 'approved')} disabled={processing === p.id} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                      Confirm & Send Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}