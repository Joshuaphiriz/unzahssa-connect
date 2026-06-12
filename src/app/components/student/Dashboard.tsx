import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Pin, ArrowRight, Phone, MessageCircle, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';
import { api } from '../shared/api';

interface NewsItem { id: string; title: string; excerpt: string; category: string; pinned: boolean; timestamp: string; }
interface Contact { id: string; role: string; name: string; description: string; phone: string; whatsapp: string; }

const CATEGORY_COLORS: Record<string, string> = {
  Announcement: '#1E3A5F', Internships: '#D4A33D', Welfare: '#2E7D55',
  Academic: '#7C3AED', Events: '#E05252', General: '#64748B',
};

export function Dashboard() {
  const { user, token, isAdmin } = useAuth();
  const { branding } = useBranding();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsModal, setNewsModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', category: 'Announcement', pinned: false });
  const [contactForm, setContactForm] = useState({ role: '', name: '', description: '', phone: '', whatsapp: '' });

  const loadData = async () => {
    try {
      const [n, c] = await Promise.all([api('/news'), api('/contacts')]);
      setNews(n || []); setContacts(c || []);
    } catch (e) { console.log('Dashboard load error:', e); }
    setLoadingNews(false);
  };

  useEffect(() => { loadData(); }, []);

  const saveNews = async () => {
    try {
      if (editingNews) {
        await api(`/news/${editingNews.id}`, { method: 'PUT', body: JSON.stringify(newsForm) }, token);
      } else {
        await api('/news', { method: 'POST', body: JSON.stringify(newsForm) }, token);
      }
      setNewsModal(false); setEditingNews(null);
      setNewsForm({ title: '', excerpt: '', category: 'Announcement', pinned: false });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    await api(`/news/${id}`, { method: 'DELETE' }, token);
    loadData();
  };

  const saveContact = async () => {
    try {
      if (editingContact) {
        await api(`/contacts/${editingContact.id}`, { method: 'PUT', body: JSON.stringify(contactForm) }, token);
      } else {
        await api('/contacts', { method: 'POST', body: JSON.stringify(contactForm) }, token);
      }
      setContactModal(false); setEditingContact(null);
      setContactForm({ role: '', name: '', description: '', phone: '', whatsapp: '' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Remove this contact?')) return;
    await api(`/contacts/${id}`, { method: 'DELETE' }, token);
    loadData();
  };

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-10 relative" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2A4F7A 60%, #1E3A5F 100%)', minHeight: 200 }}>
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full" style={{
              width: `${(i + 1) * 150}px`, height: `${(i + 1) * 150}px`,
              bottom: '-30%', right: '5%', transform: 'translate(50%, 50%)',
            }} />
          ))}
        </div>
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-white/50 text-sm font-medium mb-2 tracking-wide">
              {new Date().toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              {branding.heroTitle.replace('Welcome to', `Welcome back,`)}
            </h1>
            <p className="text-white/60 text-base max-w-lg">{branding.heroSubtitle}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/affiliations"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-all">
              Affiliation Status
            </Link>
            <Link to="/internship"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#D4A33D', color: '#fff' }}>
              Internship Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* News section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Latest News</h2>
            {isAdmin && (
              <button onClick={() => { setEditingNews(null); setNewsForm({ title: '', excerpt: '', category: 'Announcement', pinned: false }); setNewsModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#1E3A5F', color: '#fff' }}>
                <Plus size={14} /> Add News
              </button>
            )}
          </div>

          {loadingNews ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No news yet</p>
              <p className="text-sm">Check back soon for updates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ background: CATEGORY_COLORS[item.category] || '#64748B' }}>
                          {item.category}
                        </span>
                        {item.pinned && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#D4A33D' }}>
                            <Pin size={11} className="fill-current" /> Pinned
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1.5 leading-snug">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.excerpt}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(item.timestamp)}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { setEditingNews(item); setNewsForm({ title: item.title, excerpt: item.excerpt, category: item.category, pinned: item.pinned }); setNewsModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteNews(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contacts section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Contact the Team</h2>
            {isAdmin && (
              <button onClick={() => { setEditingContact(null); setContactForm({ role: '', name: '', description: '', phone: '', whatsapp: '' }); setContactModal(true); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors" style={{ color: '#1E3A5F' }}>
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className="bg-white rounded-2xl border border-border p-4 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#D4A33D' }}>{contact.role}</p>
                    <p className="font-semibold text-foreground text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{contact.description}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                      <button onClick={() => { setEditingContact(contact); setContactForm({ role: contact.role, name: contact.name, description: contact.description, phone: contact.phone, whatsapp: contact.whatsapp }); setContactModal(true); }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => deleteContact(contact.id)}
                        className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <a href={`tel:${contact.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">
                    <Phone size={12} /> Call
                  </a>
                  <a href={`https://wa.me/${contact.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                    style={{ background: '#25D366' }}>
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News modal */}
      {newsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>
                {editingNews ? 'Edit News' : 'Add News'}
              </h3>
              <button onClick={() => setNewsModal(false)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input value={newsForm.title} onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Title" className="w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-input-background focus:outline-none" />
              <textarea value={newsForm.excerpt} onChange={e => setNewsForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="Excerpt / summary" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-input-background focus:outline-none resize-none" />
              <select value={newsForm.category} onChange={e => setNewsForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-input-background focus:outline-none">
                {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newsForm.pinned} onChange={e => setNewsForm(f => ({ ...f, pinned: e.target.checked }))} />
                Pin to top
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNewsModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground">Cancel</button>
              <button onClick={saveNews} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1E3A5F' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h3>
              <button onClick={() => setContactModal(false)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {(['role', 'name', 'description', 'phone', 'whatsapp'] as const).map(field => (
                <input key={field} value={contactForm[field]} onChange={e => setContactForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-input-background focus:outline-none" />
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setContactModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground">Cancel</button>
              <button onClick={saveContact} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1E3A5F' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
