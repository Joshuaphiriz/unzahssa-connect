import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { StudentProfiles, Payments, AcademicQueries, InternshipApplications } from "../../lib/data";
import type { StudentProfile, Payment, AcademicQuery, InternshipApplication } from "../../lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLOURS = ["hsl(220,60%,35%)", "hsl(40,70%,55%)", "hsl(160,50%,45%)", "hsl(280,50%,55%)", "hsl(0,60%,50%)"];

export function Analytics() {
  const { hasAdminPage } = useAuth();
  const canSeeRevenue = hasAdminPage("payments");
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [queries, setQueries] = useState<AcademicQuery[]>([]);
  const [apps, setApps] = useState<InternshipApplication[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([StudentProfiles.list(), Payments.list(), AcademicQueries.list(), InternshipApplications.list()]).then(
      ([p, pay, q, a]) => {
        if (!active) return;
        setProfiles(p);
        setPayments(pay);
        setQueries(q);
        setApps(a);
      },
    );
    return () => { active = false; };
  }, []);

  const placedCount = apps.filter(a => a.status === "placed").length;

  const yearData = ["1st Year","2nd Year","3rd Year","4th Year"].map(y => ({
    year: y,
    students: profiles.filter(p => p.year_of_study === y).length,
    affiliated: profiles.filter(p => p.year_of_study === y && p.affiliation).length,
    placed: apps.filter(a => a.student?.year_of_study === y && a.status === "placed").length,
  }));

  const programmes = [...new Set(profiles.map(p => p.academic_programme))].filter(Boolean);
  const progData = programmes.map(prog => ({
    programme: prog.length > 18 ? prog.slice(0,18)+"…" : prog,
    students: profiles.filter(p => p.academic_programme === prog).length,
    affiliated: profiles.filter(p => p.academic_programme === prog && p.affiliation).length,
  })).sort((a,b) => b.students - a.students);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const paymentTrend = monthNames.map((m, i) => ({
    month: m,
    revenue: payments.filter(p => p.status === "confirmed" && new Date(p.created_date).getMonth() === i).reduce((s,p) => s+p.amount, 0),
    count: payments.filter(p => new Date(p.created_date).getMonth() === i).length,
  }));

  const statusBreakdown = ["pending","under_review","approved","placed","rejected"].map(s => ({
    name: s.replace("_"," "), value: apps.filter(a => a.status === s).length
  })).filter(d => d.value > 0);

  const queryTrend = monthNames.map((m, i) => ({
    month: m,
    open: queries.filter(q => q.status === "open" && new Date(q.created_date).getMonth() === i).length,
    resolved: queries.filter(q => q.status === "resolved" && new Date(q.created_date).getMonth() === i).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Detailed breakdown of student and programme metrics.</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Total Registrations", profiles.length, "bg-blue-50 border-l-blue-500"],
          ["Total Affiliated", profiles.filter(p=>p.affiliation).length, "bg-purple-50 border-l-purple-500"],
          ["Placements Made", placedCount, "bg-green-50 border-l-green-500"],
          ...(canSeeRevenue
            ? [["Total Revenue (ZMW)", payments.filter(p=>p.status==="confirmed").reduce((s,p)=>s+p.amount,0).toLocaleString(), "bg-amber-50 border-l-amber-500"]]
            : []),
        ].map(([label,value,cls]) => (
          <div key={label as string} className={`rounded-lg border border-l-4 p-4 ${cls}`}>
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <p className="text-foreground font-bold text-2xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Registrations by Year of Study</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" name="Registered" fill="hsl(220,60%,35%)" radius={[3,3,0,0]} />
              <Bar dataKey="affiliated" name="Affiliated" fill="hsl(40,70%,55%)" radius={[3,3,0,0]} />
              <Bar dataKey="placed" name="Placed" fill="hsl(160,50%,45%)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {statusBreakdown.map((_,i) => <Cell key={i} fill={COLOURS[i%COLOURS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {canSeeRevenue && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Monthly Revenue (ZMW)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={paymentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,88%)" />
                <XAxis dataKey="month" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" name="Revenue (ZMW)" stroke="hsl(220,60%,35%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Academic Queries — Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={queryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,88%)" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="open" name="Open" stroke="hsl(40,70%,55%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="hsl(160,50%,45%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Programme breakdown table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Programme Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Programme</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Students</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Affiliated</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Affil. Rate</th>
              </tr>
            </thead>
            <tbody>
              {progData.map(p => (
                <tr key={p.programme} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 text-foreground">{p.programme}</td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">{p.students}</td>
                  <td className="px-4 py-3 text-right text-foreground">{p.affiliated}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-medium ${p.students > 0 && p.affiliated/p.students >= 0.6 ? "text-green-600" : "text-muted-foreground"}`}>
                      {p.students > 0 ? `${Math.round(p.affiliated/p.students*100)}%` : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
