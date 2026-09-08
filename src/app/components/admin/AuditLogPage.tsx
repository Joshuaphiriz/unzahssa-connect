import { useState, useEffect } from "react";
import { AuditLogs } from "../../lib/data";
import type { AuditLog } from "../../lib/types";
import { ScrollText } from "lucide-react";

const ACTION_STYLES: Record<string, string> = {
  LOGIN: "bg-blue-100 text-blue-700",
  LOGOUT: "bg-gray-100 text-gray-600",
  REGISTER: "bg-green-100 text-green-700",
  STATUS_UPDATE: "bg-purple-100 text-purple-700",
  PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-700",
  QUERY_RESPONSE: "bg-yellow-100 text-yellow-700",
};

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    let active = true;
    AuditLogs.list().then(list => { if (active) setLogs(list); });
    return () => { active = false; };
  }, []);

  const fmt = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleString("en-ZM", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Last {logs.length} system events, sorted most recent first.</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No audit logs found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Page</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap font-mono">{fmt(log.created_date)}</td>
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium text-xs">{log.user_name}</p>
                      <p className="text-muted-foreground text-xs">{log.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLES[log.action] ?? "bg-muted text-muted-foreground"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs">{log.details}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{log.page}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
