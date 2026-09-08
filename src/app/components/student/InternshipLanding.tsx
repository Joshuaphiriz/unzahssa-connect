import { useNavigate } from "react-router";
import { Briefcase, FileText, Users, Award, ArrowRight, CheckCircle } from "lucide-react";

const BENEFITS = [
  { icon: Briefcase, title: "Real-world Experience", desc: "Gain practical experience in your field through placements at leading government ministries, NGOs, and private sector organisations." },
  { icon: FileText, title: "Professional CV & Letter", desc: "Build a polished CV and application letter using our guided portal — and get AI-powered writing assistance." },
  { icon: Users, title: "Employer Network", desc: "Connect with over 50 organisations actively recruiting UNZA Humanities & Social Sciences graduates." },
  { icon: Award, title: "Programme Recognition", desc: "Receive a UNZAHSSA placement certificate recognised by the University of Zambia and partner organisations." },
];

const STEPS = [
  "Register your profile and specify target organisations",
  "Build your CV and application letter in the portal",
  "Upload supporting documents (NRC, Transcript, etc.)",
  "UNZAHSSA reviews and forwards your application",
  "Receive your placement confirmation",
];

export function InternshipLanding() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-white px-8 py-14">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium mb-5">
            UNZAHSSA Internship Programme 2026
          </span>
          <h1 className="text-white mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", lineHeight: 1.2 }}>
            Launch Your Career with a Meaningful Internship
          </h1>
          <p className="text-white/70 leading-relaxed mb-8 max-w-lg">
            The UNZAHSSA Internship Programme connects Humanities and Social Sciences students with top employers across Zambia. We handle placement coordination — you focus on learning.
          </p>
          <button onClick={() => navigate("/internship/portal")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors">
            Apply Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* How it Works */}
      <section>
        <h2 className="text-foreground mb-6 text-center" style={{ fontFamily: "var(--font-display)" }}>How the Programme Works</h2>
        <div className="bg-card rounded-xl border border-border p-6">
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-foreground text-sm">{step}</span>
                  {i < 2 && <CheckCircle className="w-4 h-4 text-green-500 opacity-0" />}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="text-foreground mb-6 text-center" style={{ fontFamily: "var(--font-display)" }}>Programme Benefits</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {BENEFITS.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-card rounded-lg border-l-4 border-l-primary border border-border p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent/10 rounded-xl border border-accent/30 p-8 text-center">
        <h2 className="text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>Ready to Get Started?</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Applications for the 2026 placement drive are open. Complete your profile and documents today.
        </p>
        <button onClick={() => navigate("/internship/portal")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
          Go to Internship Portal <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
