export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
}

export type NewsMediaType = "text" | "image" | "link" | "video";

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  media_type: NewsMediaType;
  media_url: string;
  created_date: string;
  author: string;
}

export interface Contact {
  id: string;
  name: string;
  position: string;
  phone: string;
  whatsapp: string;
  sort_order: number;
  created_date: string;
}

export interface AdminUser {
  email: string;
  added_by: string;
  created_date: string;
  name?: string;      // from profiles if the person has signed up
  registered: boolean;
  is_self?: boolean;
  profile_id?: string;
  position_id?: string | null;
}

export interface AdminPosition {
  id: string;
  label: string;
  pages: string[];
}

export interface ForumReply {
  id: string;
  content: string;
  author_name: string;
  date: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  replies: ForumReply[];
  created_date: string;
}

export interface ReviewNote {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface TargetOrg {
  name: string;
}

export interface CVEntry {
  id: string;
  institution?: string;
  degree?: string;
  year?: string;
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
  title?: string;
  content?: string;
}

export interface CVData {
  personal: {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin: string;
    summary: string;
  };
  objective: string;
  education: CVEntry[];
  skills: string[];
  experience: CVEntry[];
  custom_sections: CVEntry[];
  references: CVEntry[];
  font: string;
  theme: string;
}

export interface LetterData {
  your_name: string;
  date: string;
  your_email: string;
  your_phone: string;
  your_address: string;
  recipient_name: string;
  recipient_title: string;
  org_name: string;
  org_address: string;
  subject: string;
  body: string;
  font: string;
  theme: string;
}

export type ApplicationStatus =
  | "pending" | "under_review" | "approved" | "placed" | "rejected";

export interface StudentProfile {
  id: string;        // === auth user id (profiles.id)
  user_id: string;   // kept equal to id for backwards compatibility
  role?: "student" | "admin";
  full_name: string;
  computer_number: string;
  year_of_study: string;
  academic_programme: string;
  affiliation: boolean;
  affiliation_number: string;
  affiliation_year: number | null;
  email: string;
  phone: string;
  created_date: string;
}

export interface InternshipApplication {
  id: string;
  profile_id: string;
  target_organisations: string[];
  status: ApplicationStatus;
  placement_organisation: string;
  placement_date: string;
  cv_data: CVData | null;
  letter_data: LetterData | null;
  review_notes: ReviewNote[];
  submitted_at: string | null;
  created_date: string;
  // joined (admin list only)
  student?: Pick<StudentProfile, "id" | "full_name" | "computer_number" | "academic_programme" | "year_of_study" | "email">;
}

export interface Payment {
  id: string;
  profile_id: string;
  student_name: string;
  student_email: string;
  computer_number: string;
  amount: number;
  year: number;
  payment_type: string;
  payment_method: "Mobile Money" | "Bank Transfer" | "Cash";
  reference_number: string;
  receipt_number: string;
  status: "pending" | "confirmed" | "rejected";
  receipt_sent: boolean;
  created_date: string;
}

export interface AcademicQuery {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  response: string;
  created_date: string;
}

export interface StudentDocument {
  id: string;
  profile_id: string;
  application_id: string | null;
  student_name: string;
  document_type: string;
  file_path: string;
  file_url?: string;   // transient signed URL, added at read time
  file_name: string;
  created_date: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  details: string;
  page: string;
  created_date: string;
}

export interface Branding {
  portal_name: string;
  association_name: string;
  short_name: string;
  contact_email: string;
  primary_color: string;
  accent_color: string;
  hero_title: string;
  hero_subtitle: string;
  footer_text: string;
  affiliation_fee: number;
}
