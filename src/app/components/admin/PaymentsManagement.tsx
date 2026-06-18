import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PaymentsManagement() {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchReceipt, setSearchReceipt] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

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
      fetchPayments();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const filteredPayments = payments.filter((p: any) => {
    const matchReceipt = p.receiptNumber?.toLowerCase().includes(searchReceipt.toLowerCase()) || false;
    const matchMonth = monthFilter === '' || new Date(p.submittedAt).getMonth() === parseInt(monthFilter);
    return matchReceipt || matchMonth;
  });

  const downloadPaymentsCSV = () => {
    const headers = ['Student', 'Amount', 'Method', 'Reference', 'Receipt No', 'Status', 'Submitted At'];
    const rows = filteredPayments.map((p: any) => [p.userName, `ZMW ${p.amount}`, p.method, p.reference, p.receiptNumber || 'N/A', p.status, new Date(p.submittedAt).toLocaleString()]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPaymentsPDF = () => {
    const doc = new jsPDF();
    doc.text('Payment Submissions', 14, 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 18);
    autoTable(doc, {
      head: [['Student', 'Amount', 'Method', 'Reference', 'Receipt No', 'Status', 'Submitted']],
      body: filteredPayments.map((p: any) => [p.userName, `ZMW ${p.amount}`, p.method, p.reference, p.receiptNumber || 'N/A', p.status, new Date(p.submittedAt).toLocaleString()]),
      startY: 25,
    });
    doc.save(`payments_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const pendingCount = payments.filter((p: any) => p.status === 'pending').length;
  const approvedCount = payments.filter((p: any) => p.status === 'approved').length;
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Payment Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} pending · {approvedCount} approved · Total Revenue: ZMW {totalRevenue}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPaymentsCSV} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">📄 CSV</button>
          <button onClick={downloadPaymentsPDF} className="flex items-center gap-1 px-3 py-1.5 bg-red