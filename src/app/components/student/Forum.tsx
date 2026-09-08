import React, { useState, useEffect } from "react";
import { ForumPosts, AuditLogs } from "../../lib/data";
import { useAuth } from "../../lib/auth";
import type { ForumPost } from "../../lib/types";
import { MessageSquare, ArrowLeft, Send, Plus, X, Calendar, Trash2 } from "lucide-react";

function NewPostDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (p: ForumPost) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ author_name: user?.name ?? "", title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const p = await ForumPosts.create({ title: form.title, content: form.content, author_name: form.author_name });
      onCreated(p);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>New Forum Post</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Your Name</label>
            <input required value={form.author_name} onChange={set("author_name")} placeholder="Chanda Mwale"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input required value={form.title} onChange={set("title")} placeholder="Post title…"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Content</label>
            <textarea required rows={5} value={form.content} onChange={set("content")} placeholder="Share your question or topic…"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 disabled:opacity-60 transition-colors">{saving ? "Posting…" : "Post"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostDetail({ post, onBack, onUpdated, onDeleted }: {
  post: ForumPost; onBack: () => void; onUpdated: (p: ForumPost) => void; onDeleted: (id: string) => void;
}) {
  const { user, isAdmin } = useAuth();
  const [reply, setReply] = useState({ author_name: user?.name ?? "", content: "" });
  const [saving, setSaving] = useState(false);
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await ForumPosts.addReply(post.id, { content: reply.content, author_name: reply.author_name });
      onUpdated(updated);
      setReply({ author_name: user?.name ?? "", content: "" });
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post and all its replies?")) return;
    await ForumPosts.remove(post.id);
    if (user) await AuditLogs.create({ user_name: user.name, user_email: user.email, action: "FORUM_POST_DELETED", details: post.title, page: "/forum" });
    onDeleted(post.id);
  };

  const deleteReply = async (id: string) => {
    if (!confirm("Delete this reply?")) return;
    await ForumPosts.removeReply(id);
    if (user) await AuditLogs.create({ user_name: user.name, user_email: user.email, action: "FORUM_REPLY_DELETED", details: `on "${post.title}"`, page: "/forum" });
    onUpdated((await ForumPosts.find(post.id))!);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-2 text-primary hover:underline text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </button>
        {isAdmin && (
          <button onClick={deletePost} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" /> Delete post
          </button>
        )}
      </div>

      <div className="bg-card rounded-lg border-l-4 border-l-primary border border-border p-6 mb-6">
        <h2 className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>{post.title}</h2>
        <div className="text-xs text-muted-foreground mb-4">
          Posted by <span className="font-medium text-foreground">{post.author_name}</span> · {fmt(post.created_date)}
        </div>
        <p className="text-foreground/80 leading-relaxed">{post.content}</p>
      </div>

      <h3 className="text-foreground font-semibold mb-4">
        {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
      </h3>

      {post.replies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No replies yet. Be the first to respond.
        </div>
      )}

      <div className="space-y-3 mb-8">
        {post.replies.map(r => (
          <div key={r.id} className="bg-muted rounded-lg p-4 border border-border">
            <div className="flex items-start justify-between">
              <div className="text-xs text-muted-foreground mb-2">
                <span className="font-medium text-foreground">{r.author_name}</span> · {fmt(r.date)}
              </div>
              {isAdmin && (
                <button onClick={() => deleteReply(r.id)} className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed">{r.content}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h4 className="font-medium text-foreground mb-4">Leave a Reply</h4>
        <form onSubmit={handleReply} className="space-y-3">
          <input required value={reply.author_name} onChange={e => setReply(r => ({ ...r, author_name: e.target.value }))} placeholder="Your name"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
          <textarea required rows={3} value={reply.content} onChange={e => setReply(r => ({ ...r, content: e.target.value }))} placeholder="Write your reply…"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors resize-none" />
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
            <Send className="w-3 h-3" /> {saving ? "Sending…" : "Send Reply"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Forum() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selected, setSelected] = useState<ForumPost | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    let active = true;
    ForumPosts.list().then(list => { if (active) setPosts(list); });
    return () => { active = false; };
  }, []);

  const handleUpdated = (updated: ForumPost) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  };

  const handleDeleted = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setSelected(null);
  };

  const deleteFromList = async (e: React.MouseEvent, post: ForumPost) => {
    e.stopPropagation();
    if (!confirm("Delete this post and all its replies?")) return;
    await ForumPosts.remove(post.id);
    if (user) await AuditLogs.create({ user_name: user.name, user_email: user.email, action: "FORUM_POST_DELETED", details: post.title, page: "/forum" });
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  if (selected) {
    return <PostDetail post={selected} onBack={() => setSelected(null)} onUpdated={handleUpdated} onDeleted={handleDeleted} />;
  }

  return (
    <div>
      {showNew && <NewPostDialog onClose={() => setShowNew(false)} onCreated={p => setPosts(prev => [p, ...prev])} />}

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Student Forum</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect, ask questions, and share knowledge with fellow students.</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No forum posts yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} onClick={() => setSelected(post)} role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter") setSelected(post); }}
              className="w-full text-left bg-card rounded-lg border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-foreground font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                {isAdmin && (
                  <button onClick={e => deleteFromList(e, post)} title="Delete post"
                    className="shrink-0 p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {fmt(post.created_date)} · {post.author_name}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
