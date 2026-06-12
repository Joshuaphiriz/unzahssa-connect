import { Link } from 'react-router';
import { Briefcase, Star, ArrowRight, CheckCircle, Users, Building2, Award } from 'lucide-react';

export function InternshipLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1E3A5F 0%, #152D4A 70%, #0D1F33 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full" style={{
              width: `${(i + 1) * 140}px`, height: `${(i + 1) * 140}px`,
              top: '50%', right: '10%', transform: 'translate(50%, -50%)',
            }} />
          ))}
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(212,163,61,0.15)', color: '#D4A33D', border: '1px solid rgba(212,163,61,0.3)' }}>
            <Star size={12} className="fill-current" /> UNZAHSSA Internship Programme 2024
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Launch Your<br /><span style={{ color: '#D4A33D' }}>Professional Career</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            UNZAHSSA connects students in the humanities and social sciences with leading Zambian organisations
            for structured, career-defining internship experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/internship/portal"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all hover:opacity-90 group"
              style={{ background: '#D4A33D', color: '#1E3A5F' }}>
              Enter Internship Portal <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button className="px-8 py-4 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Partner Organisations', value: '28+', icon: Building2 },
            { label: 'Successful Placements', value: '180+', icon: CheckCircle },
            { label: 'Active Students', value: '2,400+', icon: Users },
            { label: 'Average Satisfaction', value: '4.8 / 5', icon: Award },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-5 text-center shadow-sm">
              <Icon size={22} className="mx-auto mb-2" style={{ color: '#1E3A5F' }} />
              <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>
            Application Process
          </h2>
          <p className="text-muted-foreground">Three simple steps to your professional internship placement</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01', title: 'Register & Personal Details',
              desc: 'Complete your student profile, programme details, and target organisation preferences.',
              color: '#1E3A5F',
            },
            {
              step: '02', title: 'Build Your CV & Cover Letter',
              desc: 'Use our professional CV builder and application letter editor with live preview and PDF export.',
              color: '#D4A33D',
            },
            {
              step: '03', title: 'Upload Documents',
              desc: 'Submit your NRC, transcript, recommendation letter, and other required supporting documents.',
              color: '#2E7D55',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="bg-white rounded-2xl border border-border p-6">
              <div className="text-4xl font-black mb-4 leading-none" style={{ color, fontFamily: 'Playfair Display, serif', opacity: 0.3 }}>
                {step}
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/internship/portal"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1E3A5F, #2A4F7A)' }}>
            Start Your Application <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Partner logos placeholder */}
      <div className="border-t border-border bg-white py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">Partnering with leading Zambian organisations</p>
          <div className="flex flex-wrap gap-6 justify-center">
            {['Zambia Revenue Authority', 'Bank of Zambia', 'ZNBC', 'IDC Zambia', 'LASF', 'NHIMA', 'ZICTA', 'NGOCC'].map(org => (
              <div key={org} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground bg-muted/30">
                {org}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
