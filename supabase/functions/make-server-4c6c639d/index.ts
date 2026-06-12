import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function getUser(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) return null;
  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(accessToken);
    if (error || !user) return null;
    return user;
  } catch { return null; }
}

async function checkAdmin(email: string): Promise<boolean> {
  const emails: string[] = (await kv.get('admin_emails')) || [];
  return emails.includes(email);
}

async function logAudit(userId: string, userEmail: string, action: string, details: string) {
  try {
    const id = crypto.randomUUID();
    await kv.set(`audit:${id}`, { id, userId, userEmail, action, details, timestamp: new Date().toISOString() });
    const list: string[] = (await kv.get('audit_list')) || [];
    list.unshift(id);
    if (list.length > 300) list.splice(300);
    await kv.set('audit_list', list);
  } catch (e) { console.log('Audit log error:', e); }
}

// Health
app.get("/make-server-4c6c639d/health", (c) => c.json({ status: "ok" }));

// Seed initial data
app.post("/make-server-4c6c639d/seed", async (c) => {
  try {
    const existing = await kv.get('branding');
    if (!existing) {
      await kv.set('branding', {
        name: 'UNZAHSSA Connect',
        associationName: 'University of Zambia Humanities & Social Sciences Student Association',
        shortName: 'UNZAHSSA',
        logo: null,
        primaryColor: '#1E3A5F',
        accentColor: '#D4A33D',
        heroTitle: 'Welcome to UNZAHSSA Connect',
        heroSubtitle: 'Your gateway to academic excellence, student welfare, and career opportunities.',
        footerText: '© 2024 UNZAHSSA Connect. All rights reserved.',
        contactEmail: 'unzahssa@unza.zm',
        affiliationFee: 50,
      });

      const contacts = [
        { role: 'President', name: 'Mwansa Banda', description: 'Overall association leadership and student representation.', phone: '+260977000001', whatsapp: '+260977000001' },
        { role: 'Vice President', name: 'Chanda Phiri', description: 'Deputy leadership and welfare coordination.', phone: '+260977000002', whatsapp: '+260977000002' },
        { role: 'Secretary General', name: 'Natasha Mutale', description: 'Minutes, correspondence, and administrative records.', phone: '+260977000003', whatsapp: '+260977000003' },
        { role: 'Treasurer', name: 'Kelvin Zulu', description: 'Financial management and payment verification.', phone: '+260977000004', whatsapp: '+260977000004' },
        { role: 'Academic Affairs', name: 'Lorna Musonda', description: 'Academic queries, exam issues, and department liaison.', phone: '+260977000005', whatsapp: '+260977000005' },
        { role: 'Internship Coordinator', name: 'David Mwale', description: 'Internship placements and career development.', phone: '+260977000006', whatsapp: '+260977000006' },
      ];
      for (const contact of contacts) {
        const id = crypto.randomUUID();
        await kv.set(`contact:${id}`, { id, ...contact });
      }

      const news = [
        { title: 'UNZAHSSA Annual General Meeting — Save the Date', excerpt: 'The Annual General Meeting is scheduled for 15 March 2024. All members are urged to attend and participate in shaping the future of our association.', category: 'Announcement', pinned: true },
        { title: 'Internship Partnership with Top Lusaka Firms', excerpt: 'We have secured internship placements with 12 leading organisations in Lusaka. Eligible final-year students are encouraged to submit applications through the Internship Portal.', category: 'Internships', pinned: false },
        { title: 'Affiliation Drive 2024 — Get Affiliated Today', excerpt: 'Affiliation for the 2024 academic year is now open. Affiliated members enjoy exclusive benefits including academic support, career guidance, and event access.', category: 'Welfare', pinned: false },
        { title: 'End-of-Semester Academic Support Sessions', excerpt: 'UNZAHSSA is offering free academic support sessions for all students preparing for end-of-semester examinations. Sessions run Monday to Friday.', category: 'Academic', pinned: false },
      ];
      for (const item of news) {
        const id = crypto.randomUUID();
        const offset = news.indexOf(item) * 86400000;
        await kv.set(`news:${id}`, { id, ...item, timestamp: new Date(Date.now() - offset).toISOString() });
      }
    }
    return c.json({ ok: true });
  } catch (err) {
    console.log('Seed error:', err);
    return c.json({ error: String(err) }, 500);
  }
});

// Admin setup
app.post("/make-server-4c6c639d/admin/setup", async (c) => {
  try {
    const { email, setupKey } = await c.req.json();
    const storedKey = await kv.get('admin_setup_key');
    if (!storedKey) {
      await kv.set('admin_setup_key', setupKey);
    } else if (storedKey !== setupKey) {
      return c.json({ error: 'Invalid setup key' }, 403);
    }
    const emails: string[] = (await kv.get('admin_emails')) || [];
    if (!emails.includes(email)) {
      emails.push(email);
      await kv.set('admin_emails', emails);
    }
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.get("/make-server-4c6c639d/admin/check", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ isAdmin: false });
  return c.json({ isAdmin: await checkAdmin(user.email || '') });
});

// Auth signup
app.post("/make-server-4c6c639d/auth/signup", async (c) => {
  try {
    const { email, password, name, studentId, programme, yearOfStudy } = await c.req.json();
    const { data, error } = await getSupabase().auth.admin.createUser({
      email, password,
      user_metadata: { name, studentId, programme, yearOfStudy },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    await logAudit(data.user.id, email, 'SIGNUP', `New registration: ${name}`);
    return c.json({ user: data.user });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.put("/make-server-4c6c639d/auth/profile", async (c) => {
  try {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const updates = await c.req.json();
    const { data, error } = await getSupabase().auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, ...updates },
    });
    if (error) return c.json({ error: error.message }, 400);
    return c.json({ user: data.user });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Branding
app.get("/make-server-4c6c639d/branding", async (c) => {
  const branding = await kv.get('branding');
  return c.json(branding || {});
});

app.put("/make-server-4c6c639d/branding", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const updates = await c.req.json();
  const current = (await kv.get('branding')) || {};
  const updated = { ...current, ...updates };
  await kv.set('branding', updated);
  await logAudit(user.id, user.email || '', 'UPDATE_BRANDING', 'System branding updated');
  return c.json(updated);
});

// News
app.get("/make-server-4c6c639d/news", async (c) => {
  const items = await kv.getByPrefix('news:');
  const sorted = items.filter(Boolean).sort((a: any, b: any) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  return c.json(sorted);
});

app.post("/make-server-4c6c639d/news", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const { title, excerpt, category, pinned } = await c.req.json();
  const id = crypto.randomUUID();
  const item = { id, title, excerpt, category, pinned: !!pinned, timestamp: new Date().toISOString() };
  await kv.set(`news:${id}`, item);
  await logAudit(user.id, user.email || '', 'CREATE_NEWS', `News: ${title}`);
  return c.json(item);
});

app.put("/make-server-4c6c639d/news/:id", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const id = c.req.param('id');
  const existing = await kv.get(`news:${id}`);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  const updates = await c.req.json();
  const updated = { ...existing, ...updates };
  await kv.set(`news:${id}`, updated);
  return c.json(updated);
});

app.delete("/make-server-4c6c639d/news/:id", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  await kv.del(`news:${c.req.param('id')}`);
  await logAudit(user.id, user.email || '', 'DELETE_NEWS', `Deleted news: ${c.req.param('id')}`);
  return c.json({ ok: true });
});

// Contacts
app.get("/make-server-4c6c639d/contacts", async (c) => {
  const items = await kv.getByPrefix('contact:');
  return c.json(items.filter(Boolean));
});

app.post("/make-server-4c6c639d/contacts", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const contact = { id, ...body };
  await kv.set(`contact:${id}`, contact);
  await logAudit(user.id, user.email || '', 'CREATE_CONTACT', `Contact: ${body.name}`);
  return c.json(contact);
});

app.put("/make-server-4c6c639d/contacts/:id", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const id = c.req.param('id');
  const existing = await kv.get(`contact:${id}`);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  const updated = { ...existing, ...await c.req.json() };
  await kv.set(`contact:${id}`, updated);
  return c.json(updated);
});

app.delete("/make-server-4c6c639d/contacts/:id", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  await kv.del(`contact:${c.req.param('id')}`);
  return c.json({ ok: true });
});

// Forum
app.get("/make-server-4c6c639d/forum/posts", async (c) => {
  const posts = await kv.getByPrefix('fpost:');
  return c.json(posts.filter(Boolean).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
});

app.post("/make-server-4c6c639d/forum/posts", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { title, content } = await c.req.json();
  const id = crypto.randomUUID();
  const post = { id, title, content, authorId: user.id, authorName: user.user_metadata?.name || user.email, timestamp: new Date().toISOString(), replyCount: 0 };
  await kv.set(`fpost:${id}`, post);
  return c.json(post);
});

app.get("/make-server-4c6c639d/forum/posts/:id/replies", async (c) => {
  const replies = (await kv.get(`freplies:${c.req.param('id')}`)) || [];
  return c.json(replies);
});

app.post("/make-server-4c6c639d/forum/posts/:id/replies", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const postId = c.req.param('id');
  const { content } = await c.req.json();
  const reply = { id: crypto.randomUUID(), content, authorId: user.id, authorName: user.user_metadata?.name || user.email, timestamp: new Date().toISOString() };
  const replies = (await kv.get(`freplies:${postId}`)) || [];
  replies.push(reply);
  await kv.set(`freplies:${postId}`, replies);
  const post = await kv.get(`fpost:${postId}`);
  if (post) await kv.set(`fpost:${postId}`, { ...post, replyCount: replies.length });
  return c.json(reply);
});

// Payments
app.get("/make-server-4c6c639d/payments", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const isAdm = await checkAdmin(user.email || '');
  const all = await kv.getByPrefix('payment:');
  const payments = all.filter(Boolean).sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return c.json(isAdm ? payments : payments.filter((p: any) => p.userId === user.id));
});

app.post("/make-server-4c6c639d/payments", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const branding = (await kv.get('branding')) || {};
  const { method, reference, payerNumber } = await c.req.json();
  const id = crypto.randomUUID();
  const payment = {
    id, userId: user.id, userEmail: user.email,
    userName: user.user_metadata?.name || user.email,
    studentId: user.user_metadata?.studentId || '',
    programme: user.user_metadata?.programme || '',
    method, reference, payerNumber: payerNumber || null,
    amount: branding.affiliationFee || 50,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null, reviewedBy: null,
  };
  await kv.set(`payment:${id}`, payment);
  await logAudit(user.id, user.email || '', 'SUBMIT_PAYMENT', `Payment submitted via ${method}`);
  return c.json(payment);
});

app.put("/make-server-4c6c639d/payments/:id", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const id = c.req.param('id');
  const existing = await kv.get(`payment:${id}`);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  const { status } = await c.req.json();
  const updated = { ...existing, status, reviewedAt: new Date().toISOString(), reviewedBy: user.email };
  await kv.set(`payment:${id}`, updated);
  await logAudit(user.id, user.email || '', 'REVIEW_PAYMENT', `Payment ${id} → ${status}`);
  return c.json(updated);
});

// Academic Queries
app.get("/make-server-4c6c639d/queries", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const isAdm = await checkAdmin(user.email || '');
  const all = await kv.getByPrefix('query:');
  const queries = all.filter(Boolean).sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return c.json(isAdm ? queries : queries.filter((q: any) => q.userId === user.id));
});

app.post("/make-server-4c6c639d/queries", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { subject, message } = await c.req.json();
  const id = crypto.randomUUID();
  const query = {
    id, userId: user.id, userEmail: user.email,
    userName: user.user_metadata?.name || user.email,
    studentId: user.user_metadata?.studentId || '',
    programme: user.user_metadata?.programme || '',
    subject, message, status: 'open',
    adminResponse: null, respondedAt: null, respondedBy: null,
    submittedAt: new Date().toISOString(),
  };
  await kv.set(`query:${id}`, query);
  await logAudit(user.id, user.email || '', 'SUBMIT_QUERY', `Query: ${subject}`);
  return c.json(query);
});

app.put("/make-server-4c6c639d/queries/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const isAdm = await checkAdmin(user.email || '');
  const id = c.req.param('id');
  const existing = await kv.get(`query:${id}`);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (!isAdm && existing.userId !== user.id) return c.json({ error: 'Forbidden' }, 403);
  const { status, adminResponse } = await c.req.json();
  const updated = {
    ...existing, status,
    ...(isAdm && adminResponse ? { adminResponse, respondedAt: new Date().toISOString(), respondedBy: user.email } : {}),
  };
  await kv.set(`query:${id}`, updated);
  if (isAdm) await logAudit(user.id, user.email || '', 'RESPOND_QUERY', `Responded to query: ${id}`);
  return c.json(updated);
});

// Internship
app.get("/make-server-4c6c639d/internship/my", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return c.json((await kv.get(`internship:${user.id}`)) || null);
});

app.post("/make-server-4c6c639d/internship", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const existing = (await kv.get(`internship:${user.id}`)) || {
    userId: user.id, userEmail: user.email,
    userName: user.user_metadata?.name || user.email,
    status: 'draft', submittedAt: null,
  };
  const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
  if (body.submit) { updated.status = 'pending'; updated.submittedAt = new Date().toISOString(); }
  await kv.set(`internship:${user.id}`, updated);
  if (body.submit) await logAudit(user.id, user.email || '', 'SUBMIT_INTERNSHIP', 'Internship application submitted');
  return c.json(updated);
});

app.get("/make-server-4c6c639d/internship/all", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const all = await kv.getByPrefix('internship:');
  return c.json(all.filter(Boolean).sort((a: any, b: any) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()));
});

app.put("/make-server-4c6c639d/internship/:userId", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const userId = c.req.param('userId');
  const existing = await kv.get(`internship:${userId}`);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  const { status, reviewNotes } = await c.req.json();
  const updated = { ...existing, status, reviewNotes, reviewedAt: new Date().toISOString(), reviewedBy: user.email };
  await kv.set(`internship:${userId}`, updated);
  await logAudit(user.id, user.email || '', 'REVIEW_INTERNSHIP', `Internship for ${userId} → ${status}`);
  return c.json(updated);
});

// Students (admin)
app.get("/make-server-4c6c639d/students", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const { data, error } = await getSupabase().auth.admin.listUsers();
  if (error) return c.json({ error: error.message }, 400);
  const adminEmails: string[] = (await kv.get('admin_emails')) || [];
  const allPayments = await kv.getByPrefix('payment:');
  const allInternships = await kv.getByPrefix('internship:');
  const students = data.users
    .filter(u => !adminEmails.includes(u.email || ''))
    .map(u => {
      const uPayments = allPayments.filter((p: any) => p && p.userId === u.id);
      const approved = uPayments.find((p: any) => p.status === 'approved');
      const pending = uPayments.find((p: any) => p.status === 'pending');
      const internship = allInternships.find((i: any) => i && i.userId === u.id);
      return {
        id: u.id, email: u.email,
        name: u.user_metadata?.name || 'Unknown',
        studentId: u.user_metadata?.studentId || '',
        programme: u.user_metadata?.programme || '',
        yearOfStudy: u.user_metadata?.yearOfStudy || '',
        affiliationStatus: approved ? 'affiliated' : pending ? 'pending' : 'not_affiliated',
        internshipStatus: internship?.status || 'none',
        createdAt: u.created_at,
      };
    });
  return c.json(students);
});

// Audit logs
app.get("/make-server-4c6c639d/audit", async (c) => {
  const user = await getUser(c);
  if (!user || !(await checkAdmin(user.email || ''))) return c.json({ error: 'Forbidden' }, 403);
  const ids: string[] = (await kv.get('audit_list')) || [];
  const items = await kv.mget(ids.slice(0, 100).map(id => `audit:${id}`));
  return c.json(items.filter(Boolean).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
});

// Document upload
app.post("/make-server-4c6c639d/documents/upload", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('type') as string;
    if (!file) return c.json({ error: 'No file provided' }, 400);
    const supabase = getSupabase();
    const bucketName = 'make-4c6c639d-internship-docs';
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b: any) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName);
    }
    const fileName = `${user.id}/${docType}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(bucketName).upload(fileName, await file.arrayBuffer(), { contentType: file.type, upsert: true });
    if (error) return c.json({ error: error.message }, 400);
    const { data: signed } = await supabase.storage.from(bucketName).createSignedUrl(fileName, 3600);
    await logAudit(user.id, user.email || '', 'UPLOAD_DOC', `Uploaded ${docType}: ${file.name}`);
    return c.json({ path: fileName, url: signed?.signedUrl, name: file.name });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

Deno.serve(app.fetch);