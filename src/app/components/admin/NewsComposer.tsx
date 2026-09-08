import React, { useState } from "react";
import { NewsPosts } from "../../lib/data";
import { useAuth } from "../../lib/auth";
import type { NewsMediaType, NewsPost } from "../../lib/types";
import { toEmbedUrl } from "../../lib/media";
import { X, Image as ImageIcon, Link2, Video, Type } from "lucide-react";

const CATEGORIES = ["Announcement", "Internship", "Finance", "Academic", "Sports & Culture"];

type PostKind = "text" | "image_text" | "image" | "link" | "video";
const KINDS: { id: PostKind; label: string; icon: React.ElementType }[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "image_text", label: "Image + text", icon: ImageIcon },
  { id: "image", label: "Image only", icon: ImageIcon },
  { id: "link", label: "Link", icon: Link2 },
  { id: "video", label: "Video", icon: Video },
];

interface Props {
  post?: NewsPost | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NewsComposer({ post, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const initialKind: PostKind = post
    ? post.media_type === "image" ? (post.content ? "image_text" : "image") : (post.media_type as PostKind)
    : "text";
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? "Announcement");
  const [pinned, setPinned] = useState(post?.pinned ?? false);
  const [mediaUrl, setMediaUrl] = useState(post?.media_type === "link" || post?.media_type === "video" ? post.media_url : "");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const needsImage = kind === "image" || kind === "image_text";
  const needsUrl = kind === "link" || kind === "video";
  const showTitle = kind !== "image";
  const showBody = kind !== "image";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (needsUrl && !mediaUrl.trim()) { setError("Add the URL."); return; }
    if (kind === "video" && !toEmbedUrl(mediaUrl) && !/\.(mp4|webm|ogg)/i.test(mediaUrl)) {
      setError("Use a YouTube, Vimeo, or direct video (.mp4) URL.");
      return;
    }
    if (kind === "image" && !image && !post) { setError("Choose an image."); return; }

    const media_type: NewsMediaType =
      needsImage ? "image" : kind === "link" ? "link" : kind === "video" ? "video" : "text";

    setSaving(true);
    try {
      if (post) {
        await NewsPosts.update(post.id, {
          title: showTitle ? title : "",
          content: showBody ? content : "",
          category, pinned, media_type,
          media_url: needsUrl ? mediaUrl.trim() : (image ? post.media_url : post.media_url),
        });
        // image replacement on edit: recreate via create() is overkill — keep simple: only new posts upload
      } else {
        await NewsPosts.create({
          title: showTitle ? title : "",
          content: showBody ? content : "",
          category, pinned, media_type,
          media_url: needsUrl ? mediaUrl.trim() : "",
          author: user?.name || "UNZAHSSA",
          image: needsImage ? image : null,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not save the post.");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {post ? "Edit post" : "New post"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map(k => {
              const Icon = k.icon;
              return (
                <button key={k.id} type="button" onClick={() => setKind(k.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    kind === k.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {k.label}
                </button>
              );
            })}
          </div>

          {showTitle && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required={kind !== "image"} className={input} />
            </div>
          )}

          {needsImage && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Image {post && "(leave blank to keep current)"}</label>
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-muted file:text-foreground file:text-sm" />
            </div>
          )}

          {needsUrl && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{kind === "video" ? "Video URL (YouTube / Vimeo / .mp4)" : "Link URL"}</label>
              <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://…" className={input} />
            </div>
          )}

          {showBody && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{kind === "image_text" ? "Caption" : "Body"}</label>
              <textarea rows={kind === "image_text" ? 2 : 4} value={content} onChange={e => setContent(e.target.value)}
                className={`${input} resize-none`} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={input}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm pb-2.5">
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
              Pin to top
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {saving ? "Publishing…" : post ? "Save" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
