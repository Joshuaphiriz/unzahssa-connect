import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { NewsPosts, Contacts, AuditLogs } from "../../lib/data";
import { useBranding } from "../shared/BrandingContext";
import { NewsComposer } from "../admin/NewsComposer";
import { ContactEditor } from "../shared/ContactEditor";
import { toEmbedUrl, isDirectVideo } from "../../lib/media";
import type { NewsPost, Contact } from "../../lib/types";
import {
  Pin, PinOff, Phone, MessageCircle, Calendar, Plus, Trash2, Pencil, ExternalLink,
} from "lucide-react";

function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg border border-border p-5 animate-pulse">
      <div className="h-3 bg-muted rounded w-1/4 mb-3" />
      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded w-full mb-1" />
      <div className="h-3 bg-muted rounded w-4/5" />
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Announcement: "bg-blue-100 text-blue-700",
  Internship: "bg-purple-100 text-purple-700",
  Finance: "bg-green-100 text-green-700",
  Academic: "bg-amber-100 text-amber-700",
  "Sports & Culture": "bg-rose-100 text-rose-700",
};

function NewsMedia({ post }: { post: NewsPost }) {
  if (post.media_type === "image" && post.media_url) {
    return <img src={post.media_url} alt={post.title || "news image"} className="w-full rounded-lg mb-3 max-h-72 object-cover" />;
  }
  if (post.media_type === "video" && post.media_url) {
    const embed = toEmbedUrl(post.media_url);
    if (embed) {
      return (
        <div className="relative w-full mb-3 rounded-lg overflow-hidden" style={{ paddingTop: "56.25%" }}>
          <iframe src={embed} title={post.title || "video"} allowFullScreen
            className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      );
    }
    if (isDirectVideo(post.media_url)) {
      return <video src={post.media_url} controls className="w-full rounded-lg mb-3 max-h-72" />;
    }
  }
  if (post.media_type === "link" && post.media_url) {
    return (
      <a href={post.media_url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-primary hover:bg-border transition-colors break-all">
        <ExternalLink className="w-4 h-4 shrink-0" /> {post.media_url}
      </a>
    );
  }
  return null;
}

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { branding } = useBranding();
  const [news, setNews] = useState<NewsPost[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState<{ open: boolean; post: NewsPost | null }>({ open: false, post: null });
  const [contactEditor, setContactEditor] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });

  const loadNews = useCallback(() => { void NewsPosts.list().then(l => setNews(l.slice(0, 12))); }, []);
  const loadContacts = useCallback(() => { void Contacts.list().then(setContacts); }, []);

  useEffect(() => {
    let active = true;
    Promise.all([NewsPosts.list(), Contacts.list()])
      .then(([n, c]) => { if (active) { setNews(n.slice(0, 12)); setContacts(c); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  const togglePin = async (p: NewsPost) => {
    await NewsPosts.update(p.id, { pinned: !p.pinned });
    if (user) await AuditLogs.create({ user_name: user.name, user_email: user.email, action: p.pinned ? "NEWS_UNPINNED" : "NEWS_PINNED", details: p.title || "(image post)", page: "/" });
    loadNews();
  };
  const deleteNews = async (p: NewsPost) => {
    if (!confirm("Delete this post?")) return;
    await NewsPosts.remove(p.id);
    if (user) await AuditLogs.create({ user_name: user.name, user_email: user.email, action: "NEWS_DELETED", details: p.title || "(image post)", page: "/" });
    loadNews();
  };
  const deleteContact = async (c: Contact) => {
    if (!confirm(`Remove ${c.name}?`)) return;
    await Contacts.remove(c.id);
    loadContacts();
  };

  return (
    <div className="space-y-10">
      {composer.open && (
        <NewsComposer post={composer.post} onClose={() => setComposer({ open: false, post: null })} onSaved={loadNews} />
      )}
      {contactEditor.open && (
        <ContactEditor contact={contactEditor.contact} onClose={() => setContactEditor({ open: false, contact: null })} onSaved={loadContacts} />
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-12">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/10 translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium mb-4">
            University of Zambia · Humanities &amp; Social Sciences
          </span>
          <h1 className="text-white mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 }}>
            {branding.hero_title}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-white/70 leading-relaxed max-w-lg">{branding.hero_subtitle}</p>
        </div>
      </div>

      {/* News */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Latest News &amp; Announcements</h2>
          {isAdmin && (
            <button onClick={() => setComposer({ open: true, post: null })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : news.length === 0 ? (
          <p className="text-sm text-muted-foreground">No news yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {news.map(post => (
              <div key={post.id} className="bg-card rounded-lg border-l-4 border-l-accent border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground"}`}>{post.category}</span>
                  {post.pinned && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {isAdmin && (
                    <span className="ml-auto flex items-center gap-1">
                      <button onClick={() => togglePin(post)} title={post.pinned ? "Unpin" : "Pin"}
                        className="p-1 rounded text-muted-foreground hover:text-accent hover:bg-muted transition-colors">
                        {post.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setComposer({ open: true, post })} title="Edit"
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteNews(post)} title="Delete"
                        className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>
                <NewsMedia post={post} />
                {post.title && <h3 className="text-foreground font-semibold mb-2 leading-snug">{post.title}</h3>}
                {post.content && <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">{post.content}</p>}
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" /> {fmt(post.created_date)} <span className="ml-1">· {post.author}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contacts */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Contact the Team</h2>
          {isAdmin && (
            <button onClick={() => setContactEditor({ open: true, contact: null })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
              <Plus className="w-4 h-4" /> Add contact
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold text-sm">{c.name?.[0] ?? "?"}</span>
                </div>
                {isAdmin && (
                  <span className="flex items-center gap-1">
                    <button onClick={() => setContactEditor({ open: true, contact: c })} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteContact(c)} className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </span>
                )}
              </div>
              <h3 className="text-foreground font-semibold text-sm mb-0.5">{c.name}</h3>
              <p className="text-muted-foreground text-xs mb-3">{c.position}</p>
              <div className="flex gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                    <Phone className="w-3 h-3" /> Call
                  </a>
                )}
                {c.whatsapp && (
                  <a href={`https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
          {contacts.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
