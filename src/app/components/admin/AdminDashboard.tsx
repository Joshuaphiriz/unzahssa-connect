import React, { useState, useEffect } from "react";
import { StudentProfiles, Payments, AcademicQueries, InternshipApplications } from "../../lib/data";
import type { StudentProfile, Payment, AcademicQuery, InternshipApplication } from "../../lib/types";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { Users, Briefcase, Clock, Award, DollarSign, CreditCard, HelpCircle, TrendingUp, Download } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <p className="text-muted-foreground text-sm">{label}</p>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-foreground font-bold" style={{ fontSize: "1.75rem", lineHeight: 1.1 }}>{value}</p>
    </div>
  );
}

const COLORS = ["hsl(220,60%,35%)", "hsl(40,70%,55%)", "hsl(160,50%,45%)", "hsl(280,50%,55%)", "hsl(0,60%,50%)"];

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard() {
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
  const total = profiles.length;
  const placed = apps.filter(a => a.status === "placed").length;
  const pending = apps.filter(a => a.status === "pending").length;
  const affiliated = profiles.filter(p => p.affiliation).length;
  const confirmedRev = payments.filter(p => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const placementRate = apps.length > 0 ? Math.round((placed / apps.length) * 100) : 0;

  const yearData = ["1st Year","2nd Year","3rd Year","4th Year"].map(y => ({
    year: y, students: profiles.filter(p => p.year_of_study === y).length,
    placed: apps.filter(a => a.student?.year_of_study === y && a.status === "placed").length,
  }));

  const statusData = ["pending","under_review","approved","placed","rejected"].map(s => ({
    name: s.replace("_", " "), value: apps.filter(a => a.status === s).length,
  })).filter(d => d.value > 0);

  const affiliationData = [
    { name: "Affiliated", value: affiliated },
    { name: "Not Affiliated", value: total - affiliated },
  ];

  const queryData = ["open","in_progress","resolved"].map(s => ({
    name: s.replace("_", " "), value: queries.filter(q => q.status === s).length,
  }));

  const programmes = [...new Set(profiles.map(p => p.academic_programme))].filter(Boolean);
  const progData = programmes.slice(0,6).map(prog => ({
    programme: prog.length > 15 ? prog.slice(0,15)+"…" : prog,
    count: profiles.filter(p => p.academic_programme === prog).length,
  })).sort((a,b) => b.count - a.count);

  const radarData = programmes.slice(0,5).map(prog => {
    const ps = profiles.filter(p => p.academic_programme === prog);
    return {
      programme: prog.slice(0,12),
      registered: ps.length,
      affiliated: ps.filter(p => p.affiliation).length,
      placed: apps.filter(a => a.student?.academic_programme === prog && a.status === "placed").length,
    };
  });

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short" });

  const exportStudents = () => downloadCSV(
    "unzahssa-students.csv",
    ["Name","Computer No.","Year","Programme","Affiliation","Email","Phone"],
    profiles.map(p => [p.full_name, p.computer_number, p.year_of_study, p.academic_programme, p.affiliation ? `Yes (${p.affiliation_year ?? ""})` : "No", p.email, p.phone])
  );

  const exportPayments = () => downloadCSV(
    "unzahssa-payments.csv",
    ["Student","Email","Computer No.","Amount","Method","Reference","Status","Date"],
    payments.map(p => [p.student_name, p.student_email, p.computer_number, `ZMW ${p.amount}`, p.payment_method, p.reference_number, p.status, fmt(p.created_date)])
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of UNZAHSSA portal activity.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportStudents} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Students CSV
          </button>
          <button onClick={exportPayments} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Payments CSV
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={total} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Briefcase} label="Placed" value={placed} color="bg-green-100 text-green-600" />
        <StatCard icon={Clock} label="Pending Review" value={pending} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={Award} label="Affiliated" value={affiliated} color="bg-purple-100 text-purple-600" />
        <StatCard icon={DollarSign} label="Confirmed Revenue (ZMW)" value={confirmedRev.toLocaleString()} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={CreditCard} label="Pending Payments" value={pendingPayments} color="bg-orange-100 text-orange-600" />
        <StatCard icon={HelpCircle} label="Academic Queries" value={queries.length} color="bg-sky-100 text-sky-600" />
        <StatCard icon={TrendingUp} label="Placement Rate" value={`${placementRate}%`} color="bg-rose-100 text-rose-600" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Students by Year vs. Placed</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" name="Registered" fill="hsl(220,60%,35%)" radius={[3,3,0,0]} />
              <Bar dataKey="placed" name="Placed" fill="hsl(40,70%,55%)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Application Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Affiliation Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={affiliationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {affiliationData.map((_, i) => <Cell key={i} fill={i === 0 ? "hsl(160,50%,45%)" : "hsl(220,15%,75%)"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Academic Query Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={queryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                {queryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Programmes</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={progData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="programme" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill="hsl(220,60%,35%)" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar + Recent payments */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Programme Engagement Overview</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="programme" tick={{ fontSize: 10 }} />
              <Radar name="Registered" dataKey="registered" stroke="hsl(220,60%,35%)" fill="hsl(220,60%,35%)" fillOpacity={0.3} />
              <Radar name="Affiliated" dataKey="affiliated" stroke="hsl(40,70%,55%)" fill="hsl(40,70%,55%)" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Payment Submissions</h3>
          <div className="space-y-3">
            {payments.slice(0,5).map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-xs">{p.student_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{p.student_name}</p>
                  <p className="text-muted-foreground text-xs">{p.reference_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">ZMW {p.amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "confirmed" ? "bg-green-100 text-green-700" : p.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
