import { supabase } from "./supabase";
import type {
  NewsPost, ForumPost, StudentProfile, Payment, AcademicQuery,
  StudentDocument, AuditLog, Branding, Contact, InternshipApplication, AdminUser,
} from "./types";

const DOCS_BUCKET = "internship-docs";
const MEDIA_BUCKET = "media";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Branding ───────────────────────────────────────────────

export const DEFAULT_BRANDING: Branding = {
  portal_name: "UNZAHSSA Connect",
  association_name: "University of Zambia Humanities & Social Sciences Students Association",
  short_name: "UNZAHSSA",
  contact_email: "info@unzahssa.org.zm",
  primary_color: "#1E3A5F",
  accent_color: "#D4A33D",
  hero_title: "Welcome to UNZAHSSA",
  hero_subtitle:
    "Your student association portal for academic support, internship placements, and community engagement at the University of Zambia.",
  footer_text: "UNZAHSSA. University of Zambia Humanities & Social Sciences Association.",
  affiliation_fee: 50,
};

export const BrandingStore = {
  get: async (): Promise<Branding> => {
    const { data } = await supabase.from("branding").select("data").eq("id", 1).maybeSingle();
    return { ...DEFAULT_BRANDING, ...((data?.data as Partial<Branding>) ?? {}) };
  },
  save: async (data: Branding): Promise<Branding> => {
    await supabase.from("branding").upsert({ id: 1, data, updated_date: new Date().toISOString() });
    return data;
  },
  reset: async (): Promise<Branding> => {
    await supabase.from("branding").upsert({ id: 1, data: DEFAULT_BRANDING, updated_date: new Date().toISOString() });
    return DEFAULT_BRANDING;
  },
};

// ── News ───────────────────────────────────────────────────

export interface NewsInput {
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  media_type: NewsPost["media_type"];
  media_url: string;
  author: string;
  image?: File | null;
}

export const NewsPosts = {
  list: async (): Promise<NewsPost[]> => {
    const { data } = await supabase
      .from("news_posts")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_date", { ascending: false });
    return (data ?? []) as NewsPost[];
  },
  create: async (input: NewsInput): Promise<NewsPost> => {
    let media_url = input.media_url;
    if (input.image) {
      const ext = input.image.name.split(".").pop() || "jpg";
      const path = `news/${Date.now()}.${ext}`;
      const up = await supabase.storage.from(MEDIA_BUCKET).upload(path, input.image, {
        contentType: input.image.type,
        upsert: true,
      });
      if (up.error) throw up.error;
      media_url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const { image, ...rest } = input;
    const { data, error } = await supabase
      .from("news_posts")
      .insert({ ...rest, media_url })
      .select()
      .single();
    if (error) throw error;
    return data as NewsPost;
  },
  update: async (id: string, patch: Partial<NewsPost>): Promise<NewsPost> => {
    const { data, error } = await supabase.from("news_posts").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as NewsPost;
  },
  remove: async (id: string) => {
    await supabase.from("news_posts").delete().eq("id", id);
  },
};

// ── Forum ──────────────────────────────────────────────────

function mapForumPost(row: any): ForumPost {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author_name: row.author_name,
    created_date: row.created_date,
    replies: (row.forum_replies ?? [])
      .map((r: any) => ({ id: r.id, content: r.content, author_name: r.author_name, date: r.created_date }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };
}

export const ForumPosts = {
  list: async (): Promise<ForumPost[]> => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*, forum_replies(*)")
      .order("created_date", { ascending: false });
    return (data ?? []).map(mapForumPost);
  },
  find: async (id: string): Promise<ForumPost | undefined> => {
    const { data } = await supabase.from("forum_posts").select("*, forum_replies(*)").eq("id", id).maybeSingle();
    return data ? mapForumPost(data) : undefined;
  },
  create: async (input: { title: string; content: string; author_name: string }): Promise<ForumPost> => {
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from("forum_posts")
      .insert({ title: input.title, content: input.content, author_name: input.author_name, author_id: uid })
      .select("*, forum_replies(*)")
      .single();
    if (error) throw error;
    return mapForumPost(data);
  },
  addReply: async (postId: string, reply: { content: string; author_name: string }): Promise<ForumPost> => {
    const uid = await currentUserId();
    const { error } = await supabase
      .from("forum_replies")
      .insert({ post_id: postId, content: reply.content, author_name: reply.author_name, author_id: uid });
    if (error) throw error;
    return (await ForumPosts.find(postId))!;
  },
  remove: async (id: string) => {
    const { error } = await supabase.from("forum_posts").delete().eq("id", id);
    if (error) throw error;
  },
  removeReply: async (id: string) => {
    const { error } = await supabase.from("forum_replies").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Contacts ───────────────────────────────────────────────

export const Contacts = {
  list: async (): Promise<Contact[]> => {
    const { data } = await supabase.from("contacts").select("*").order("sort_order").order("created_date");
    return (data ?? []) as Contact[];
  },
  create: async (input: Omit<Contact, "id" | "created_date">): Promise<Contact> => {
    const { data, error } = await supabase.from("contacts").insert(input).select().single();
    if (error) throw error;
    return data as Contact;
  },
  update: async (id: string, patch: Partial<Contact>): Promise<Contact> => {
    const { data, error } = await supabase.from("contacts").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as Contact;
  },
  remove: async (id: string) => {
    await supabase.from("contacts").delete().eq("id", id);
  },
};

// ── Student Profiles (profiles table) ──────────────────────

function mapProfile(row: any): StudentProfile {
  return { ...row, user_id: row.id } as StudentProfile;
}

const PROFILE_WRITE_KEYS = [
  "full_name", "computer_number", "year_of_study", "academic_programme", "phone",
  "email", "affiliation", "affiliation_number", "affiliation_year",
] as const;

function pickProfileWrites(data: Partial<StudentProfile>) {
  const out: Record<string, unknown> = {};
  for (const k of PROFILE_WRITE_KEYS) {
    if (k in data && (data as any)[k] !== undefined) out[k] = (data as any)[k];
  }
  return out;
}

export const StudentProfiles = {
  list: async (): Promise<StudentProfile[]> => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_date", { ascending: false });
    return (data ?? []).map(mapProfile);
  },
  find: async (id: string): Promise<StudentProfile | undefined> => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    return data ? mapProfile(data) : undefined;
  },
  findByUser: async (userId: string): Promise<StudentProfile | undefined> => StudentProfiles.find(userId),
  create: async (input: Partial<StudentProfile>): Promise<StudentProfile> => {
    const uid = await currentUserId();
    if (!uid) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: uid, ...pickProfileWrites(input) })
      .select()
      .single();
    if (error) throw error;
    return mapProfile(data);
  },
  update: async (id: string, patch: Partial<StudentProfile>): Promise<StudentProfile> => {
    const { data, error } = await supabase
      .from("profiles")
      .update(pickProfileWrites(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapProfile(data);
  },
};

// ── Affiliations (reset helpers) ───────────────────────────

export const Affiliations = {
  reset: async (profileId: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ affiliation: false, affiliation_year: null, affiliation_number: "" })
      .eq("id", profileId);
    if (error) throw error;
  },
  resetAll: async (): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ affiliation: false, affiliation_year: null, affiliation_number: "" })
      .eq("role", "student");
    if (error) throw error;
  },
};

// ── Payments ───────────────────────────────────────────────

const currentYear = () => new Date().getFullYear();

export const Payments = {
  list: async (): Promise<Payment[]> => {
    const { data } = await supabase.from("payments").select("*").order("created_date", { ascending: false });
    return (data ?? []) as Payment[];
  },
  findByProfile: async (profileId: string): Promise<Payment[]> => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_date", { ascending: false });
    return (data ?? []) as Payment[];
  },
  create: async (input: Omit<Payment, "id" | "created_date" | "year" | "receipt_number">): Promise<Payment> => {
    const { data, error } = await supabase
      .from("payments")
      .insert({ ...input, year: currentYear() })
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },
  /** Confirm a payment: stamp a receipt number and affiliate the student for that year. */
  confirm: async (p: Payment): Promise<Payment> => {
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("year", p.year);
    const seq = String((count ?? 0) + 1).padStart(5, "0");
    const receipt_number = `UZ-${p.year}-${seq}`;
    const { data, error } = await supabase
      .from("payments")
      .update({ status: "confirmed", receipt_sent: true, receipt_number })
      .eq("id", p.id)
      .select()
      .single();
    if (error) throw error;
    await supabase
      .from("profiles")
      .update({
        affiliation: true,
        affiliation_year: p.year,
        affiliation_number: `AHSSA-${p.year}-${seq}`,
      })
      .eq("id", p.profile_id);
    return data as Payment;
  },
  reject: async (p: Payment): Promise<Payment> => {
    const { data, error } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", p.id)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },
};

// ── Academic Queries ───────────────────────────────────────

export const AcademicQueries = {
  list: async (): Promise<AcademicQuery[]> => {
    const { data } = await supabase.from("academic_queries").select("*").order("created_date", { ascending: false });
    return (data ?? []) as AcademicQuery[];
  },
  findByUser: async (userId: string): Promise<AcademicQuery[]> => {
    const { data } = await supabase
      .from("academic_queries")
      .select("*")
      .eq("user_id", userId)
      .order("created_date", { ascending: false });
    return (data ?? []) as AcademicQuery[];
  },
  create: async (input: Omit<AcademicQuery, "id" | "created_date">): Promise<AcademicQuery> => {
    const { data, error } = await supabase.from("academic_queries").insert(input).select().single();
    if (error) throw error;
    return data as AcademicQuery;
  },
  update: async (id: string, patch: Partial<AcademicQuery>): Promise<AcademicQuery> => {
    const { data, error } = await supabase.from("academic_queries").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as AcademicQuery;
  },
};

// ── Internship Applications ────────────────────────────────

function mapApplication(row: any): InternshipApplication {
  const { profiles, ...rest } = row;
  return {
    ...rest,
    target_organisations: row.target_organisations ?? [],
    review_notes: row.review_notes ?? [],
    student: profiles
      ? {
          id: profiles.id,
          full_name: profiles.full_name,
          computer_number: profiles.computer_number,
          academic_programme: profiles.academic_programme,
          year_of_study: profiles.year_of_study,
          email: profiles.email,
        }
      : undefined,
  } as InternshipApplication;
}

const APP_WRITE_KEYS = [
  "target_organisations", "status", "placement_organisation", "placement_date",
  "cv_data", "letter_data", "review_notes", "submitted_at",
] as const;

function pickAppWrites(data: Partial<InternshipApplication>) {
  const out: Record<string, unknown> = {};
  for (const k of APP_WRITE_KEYS) {
    if (k in data && (data as any)[k] !== undefined) out[k] = (data as any)[k];
  }
  return out;
}

export const InternshipApplications = {
  listByProfile: async (profileId: string): Promise<InternshipApplication[]> => {
    const { data } = await supabase
      .from("internship_applications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_date", { ascending: false });
    return (data ?? []).map(mapApplication);
  },
  list: async (): Promise<InternshipApplication[]> => {
    const { data } = await supabase
      .from("internship_applications")
      .select("*, profiles(id, full_name, computer_number, academic_programme, year_of_study, email)")
      .order("created_date", { ascending: false });
    return (data ?? []).map(mapApplication);
  },
  find: async (id: string): Promise<InternshipApplication | undefined> => {
    const { data } = await supabase
      .from("internship_applications")
      .select("*, profiles(id, full_name, computer_number, academic_programme, year_of_study, email)")
      .eq("id", id)
      .maybeSingle();
    return data ? mapApplication(data) : undefined;
  },
  create: async (profileId: string): Promise<InternshipApplication> => {
    const { data, error } = await supabase
      .from("internship_applications")
      .insert({ profile_id: profileId })
      .select()
      .single();
    if (error) throw error;
    return mapApplication(data);
  },
  update: async (id: string, patch: Partial<InternshipApplication>): Promise<InternshipApplication> => {
    const { data, error } = await supabase
      .from("internship_applications")
      .update(pickAppWrites(patch))
      .eq("id", id)
      .select("*, profiles(id, full_name, computer_number, academic_programme, year_of_study, email)")
      .single();
    if (error) throw error;
    return mapApplication(data);
  },
  remove: async (id: string) => {
    await supabase.from("internship_applications").delete().eq("id", id);
  },
};

// ── Student Documents (+ Supabase Storage) ─────────────────

async function withSignedUrls(rows: any[], forceDownload = false): Promise<StudentDocument[]> {
  return Promise.all(
    (rows ?? []).map(async (d) => {
      const { data } = await supabase.storage
        .from(DOCS_BUCKET)
        .createSignedUrl(d.file_path, 3600, forceDownload ? { download: d.file_name } : undefined);
      return { ...d, file_url: data?.signedUrl } as StudentDocument;
    }),
  );
}

export const StudentDocuments = {
  list: async (): Promise<StudentDocument[]> => {
    const { data } = await supabase.from("student_documents").select("*").order("created_date", { ascending: false });
    return withSignedUrls(data ?? [], true);
  },
  findByApplication: async (applicationId: string, forceDownload = false): Promise<StudentDocument[]> => {
    const { data } = await supabase
      .from("student_documents")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_date", { ascending: false });
    return withSignedUrls(data ?? [], forceDownload);
  },
  findByProfile: async (profileId: string, forceDownload = false): Promise<StudentDocument[]> => {
    const { data } = await supabase
      .from("student_documents")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_date", { ascending: false });
    return withSignedUrls(data ?? [], forceDownload);
  },
  upload: async (
    profile: { id: string; full_name: string },
    documentType: string,
    file: File,
    applicationId: string | null = null,
  ): Promise<StudentDocument> => {
    const uid = await currentUserId();
    if (!uid) throw new Error("Not signed in");
    const ext = file.name.split(".").pop() || "dat";
    const path = `${uid}/${documentType.replace(/\s+/g, "_")}/${Date.now()}.${ext}`;
    const up = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type, upsert: true });
    if (up.error) throw up.error;
    const fileName = `${profile.full_name.replace(/\s+/g, "-")}-${documentType.replace(/\s+/g, "_")}.${ext}`;
    const { data, error } = await supabase
      .from("student_documents")
      .insert({
        profile_id: profile.id,
        application_id: applicationId,
        student_name: profile.full_name,
        document_type: documentType,
        file_path: path,
        file_name: fileName,
      })
      .select()
      .single();
    if (error) throw error;
    return (await withSignedUrls([data]))[0];
  },
  remove: async (id: string) => {
    const { data } = await supabase.from("student_documents").select("file_path").eq("id", id).maybeSingle();
    if (data?.file_path) await supabase.storage.from(DOCS_BUCKET).remove([data.file_path]);
    await supabase.from("student_documents").delete().eq("id", id);
  },
};

// ── Programmes ─────────────────────────────────────────────

export const Programmes = {
  list: async (): Promise<string[]> => {
    const { data } = await supabase.from("programmes").select("name").order("name");
    return (data ?? []).map((r) => r.name as string);
  },
  add: async (name: string): Promise<string[]> => {
    await supabase.from("programmes").insert({ name: name.trim() });
    return Programmes.list();
  },
  remove: async (name: string): Promise<string[]> => {
    await supabase.from("programmes").delete().eq("name", name);
    return Programmes.list();
  },
  rename: async (from: string, to: string): Promise<string[]> => {
    await supabase.from("programmes").update({ name: to.trim() }).eq("name", from);
    return Programmes.list();
  },
};

// ── Admin Users (email allow-list) ────────────────────────

export const AdminUsers = {
  list: async (): Promise<AdminUser[]> => {
    const uid = await currentUserId();
    const { data: rows } = await supabase.from("admin_emails").select("*").order("created_date");
    const { data: me } = uid
      ? await supabase.from("profiles").select("email").eq("id", uid).maybeSingle()
      : { data: null };
    const emails = (rows ?? []).map((r) => r.email as string);
    const { data: profs } = emails.length
      ? await supabase.from("profiles").select("email, full_name").in("email", emails)
      : { data: [] as any[] };
    const byEmail = new Map((profs ?? []).map((p: any) => [p.email.toLowerCase(), p.full_name as string]));
    return (rows ?? []).map((r: any) => ({
      email: r.email,
      added_by: r.added_by,
      created_date: r.created_date,
      name: byEmail.get(r.email.toLowerCase()),
      registered: byEmail.has(r.email.toLowerCase()),
      is_self: me?.email?.toLowerCase() === r.email.toLowerCase(),
    }));
  },
  add: async (email: string, addedBy: string): Promise<void> => {
    const e = email.trim().toLowerCase();
    const { error } = await supabase.from("admin_emails").insert({ email: e, added_by: addedBy });
    if (error) throw error;
    await supabase.from("profiles").update({ role: "admin" }).eq("email", e);
  },
  remove: async (email: string): Promise<void> => {
    const e = email.trim().toLowerCase();
    await supabase.from("admin_emails").delete().eq("email", e);
    await supabase.from("profiles").update({ role: "student" }).eq("email", e);
  },
};

// ── Audit Logs ─────────────────────────────────────────────

export const AuditLogs = {
  list: async (): Promise<AuditLog[]> => {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_date", { ascending: false })
      .limit(100);
    return (data ?? []) as AuditLog[];
  },
  create: async (input: Omit<AuditLog, "id" | "created_date">): Promise<void> => {
    await supabase.from("audit_logs").insert(input).then(
      () => {},
      (e) => console.warn("audit log failed", e),
    );
  },
};
