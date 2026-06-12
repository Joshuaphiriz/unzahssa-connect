import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (token) {
      api('/audit', {}, token).then(setLogs).catch(console.error);
    }
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
      <table className="w-full border">
        <thead><tr className="bg-gray-100"><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
        <tbody>
          {logs.map((log: any) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="p-2">{log.userEmail}</td>
              <td className="p-2">{log.action}</td>
              <td className="p-2">{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}