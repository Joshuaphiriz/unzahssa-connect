import { useEffect, useState } from 'react';
import { MessageSquare, Plus, ChevronDown, ChevronUp, Send, X } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

interface Post { id: string; title: string; content: string; authorName: string; timestamp: string; replyCount: number; }
interface Reply { id: string; content: string; authorName: string; timestamp: string; }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Forum() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [newModal, setNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    try { setPosts(await api('/forum/posts')); } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const togglePost = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!replies[id]) {
      try {
        const r = await api(`/forum/posts/${id}/replies`, {}, token);
        setReplies(prev => ({ ...prev, [id]: r }));
      } catch (e) { console.log(e); }
    }
  };

  const submitReply = async (postId: string) => {
    const content = replyText[postId]?.trim();
    if (!content) return;
    try {
      const reply = await api(`/forum/posts/${postId}/replies`, { method: 'POST', body: JSON.stringify({ content }) }, token);
      setReplies(prev => ({ ...prev, [postId]: [...(prev[postId] || []), reply] }));
      setReplyText(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p));
    } catch (e: any) { alert(e.message); }
  };

  const createPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    try {
      const post = await api('/forum/posts', { method: 'POST', body: JSON.stringify({ title: newTitle, content: newContent }) }, token);
      setPosts(prev => [post, ...prev]);
      setNewModal(false); setNewTitle(''); setNewContent('');
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Student Forum</h1>
          <p className="text-muted-foreground text-sm mt-1">Discuss, ask questions, and engage with fellow students</p>
        </div>
        {token && (
          <button onClick={() => setNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#1E3A5F' }}>
            <Plus size={15} /> New Post
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <MessageSquare size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-lg font-semibold text-foreground">No discussions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to start a conversation.</p>
          {token && (
            <button onClick={() => setNewModal(true)} className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#1E3A5F' }}>
              Start a discussion
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-border overflow-hidden transition-shadow hover:shadow-sm">
              <button onClick={() => togglePost(post.id)} className="w-full text-left p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground leading-snug mb-1">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1E3A5F' }}>
                          {post.authorName?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">{post.authorName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(post.timestamp)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare size={11} /> {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                  {expanded === post.id ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0 mt-1" />}
                </div>
              </button>

              {expanded === post.id && (
                <div className="border-t border-border">
                  {/* Replies */}
                  <div className="px-5 py-4 space-y-4 bg-muted/30">
                    {(replies[post.id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-3">No replies yet. Be the first to respond.</p>
                    ) : (
                      (replies[post.id] || []).map(reply => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ background: '#D4A33D' }}>
                            {reply.authorName?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 bg-white rounded-xl p-3 border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground">{reply.authorName}</span>
                              <span className="text-xs text-muted-foreground">{timeAgo(reply.timestamp)}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply composer */}
                  {token && (
                    <div className="px-5 py-4 border-t border-border flex gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1E3A5F' }}>
                        {user?.user_metadata?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          value={replyText[post.id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(post.id); } }}
                          placeholder="Write a reply…"
                          className="flex-1 px-4 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none"
                        />
                        <button onClick={() => submitReply(post.id)} disabled={!replyText[post.id]?.trim()}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:opacity-90"
                          style={{ background: '#1E3A5F' }}>
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New post modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Start a Discussion</h3>
              <button onClick={() => setNewModal(false)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Discussion title"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Share your thoughts, questions or ideas…"
                rows={5} className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setNewModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground">Cancel</button>
              <button onClick={createPost} disabled={submitting || !newTitle.trim() || !newContent.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#1E3A5F' }}>
                {submitting ? 'Posting…' : 'Post Discussion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
