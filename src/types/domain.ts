export type CaseStatus =
  | "submitted"
  | "acknowledged"
  | "assigned"
  | "in_progress"
  | "awaiting_university"
  | "awaiting_student"
  | "resolved"
  | "closed"
  | "rejected";

export type CasePriority = "low" | "normal" | "high" | "urgent";

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  assigned: "Assigned",
  in_progress: "In Progress",
  awaiting_university: "Awaiting University",
  awaiting_student: "Awaiting Student",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Rejected",
};

export const CASE_STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  submitted: "We've received this and it's waiting to be reviewed.",
  acknowledged: "The Student Union has seen this and will assign it shortly.",
  assigned: "This has been assigned to a Student Union officer.",
  in_progress: "The Student Union is actively working on this.",
  awaiting_university: "We've escalated this to the university and are following up.",
  awaiting_student: "We need more information from you to continue — please reply below.",
  resolved: "This has been resolved. Let us know how we did.",
  closed: "This case is closed.",
  rejected: "This case was not accepted — see the comments below for why.",
};

export const OPEN_CASE_STATUSES: CaseStatus[] = [
  "submitted",
  "acknowledged",
  "assigned",
  "in_progress",
  "awaiting_university",
  "awaiting_student",
];

export const OVERDUE_THRESHOLD_HOURS = 72;

export const ESCALATION_OFFICES = [
  "Works & Maintenance",
  "Health Centre",
  "Bursary",
  "Security",
  "Academic Affairs",
  "Student Affairs",
  "ICT Support",
  "Hostel Management",
  "Other",
] as const;

export const CASE_STATUSES: CaseStatus[] = [
  "submitted",
  "acknowledged",
  "assigned",
  "in_progress",
  "awaiting_university",
  "awaiting_student",
  "resolved",
  "closed",
  "rejected",
];

export const CASE_PRIORITIES: CasePriority[] = ["low", "normal", "high", "urgent"];

export interface Faculty {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  name: string;
}

export interface Programme {
  id: string;
  department_id: string;
  name: string;
}

export interface AcademicLevel {
  id: string;
  name: string;
  sort_order: number;
}

export interface CaseCategory {
  id: string;
  name: string;
  description: string | null;
  is_sensitive: boolean;
  is_active: boolean;
  allow_anonymous: boolean;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  school_email: string;
  matric_number: string;
  user_type: "student" | "staff";
  is_verified: boolean;
  faculty_id: string | null;
  department_id: string | null;
  programme_id: string | null;
  academic_level_id: string | null;
  profile_photo_url: string | null;
}

export interface CaseRecord {
  id: string;
  reference_number: string;
  student_id: string;
  category_id: string;
  title: string;
  description: string;
  location: string | null;
  status: CaseStatus;
  priority: CasePriority;
  is_anonymous: boolean;
  assigned_to: string | null;
  escalated_to_office: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  case_categories?: { name: string };
  users?: { first_name: string; last_name: string; school_email: string } | null;
}

export interface CaseAttachment {
  id: string;
  case_id: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface CaseComment {
  id: string;
  case_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  users?: { first_name: string; last_name: string; user_type: string } | null;
}

export interface CaseHistoryEntry {
  id: string;
  case_id: string;
  changed_by: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export type EventCategory =
  | "social"
  | "academic"
  | "sports"
  | "career"
  | "orientation"
  | "entertainment"
  | "student_union"
  | "clubs"
  | "cultural"
  | "religious"
  | "workshops"
  | "competitions"
  | "volunteering";

export type EventStatus = "draft" | "published" | "cancelled";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  social: "Social",
  academic: "Academic",
  sports: "Sports",
  career: "Career",
  orientation: "Orientation",
  entertainment: "Entertainment",
  student_union: "Student Union",
  clubs: "Clubs",
  cultural: "Cultural",
  religious: "Religious",
  workshops: "Workshops",
  competitions: "Competitions",
  volunteering: "Volunteering",
};

export const EVENT_CATEGORIES: EventCategory[] = [
  "social",
  "academic",
  "sports",
  "career",
  "orientation",
  "entertainment",
  "student_union",
  "clubs",
  "cultural",
  "religious",
  "workshops",
  "competitions",
  "volunteering",
];

export interface EventRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  category: EventCategory;
  status: EventStatus;
  start_at: string;
  end_at: string | null;
  location: string | null;
  organiser: string | null;
  contact_person: string | null;
  capacity: number | null;
  rsvp_enabled: boolean;
  author_id: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  rsvp_count?: number;
  viewer_has_rsvped?: boolean;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  users?: { first_name: string; last_name: string; school_email: string };
}

export type AnnouncementCategory =
  | "student_union"
  | "campus_news"
  | "faculty"
  | "administrative"
  | "event_promotion";

export type AnnouncementPriority = "normal" | "urgent";
export type AnnouncementStatus = "draft" | "scheduled" | "published" | "archived";
export type AnnouncementAudience = "everyone" | "faculty";

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  student_union: "Student Union",
  campus_news: "Campus News",
  faculty: "Faculty",
  administrative: "Administrative",
  event_promotion: "Event Promotion",
};

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  "student_union",
  "campus_news",
  "faculty",
  "administrative",
  "event_promotion",
];

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export const ANNOUNCEMENT_STATUSES: AnnouncementStatus[] = ["draft", "scheduled", "published", "archived"];

export type CampusContentCategory =
  | "academic"
  | "health_safety"
  | "accommodation_transport"
  | "student_services"
  | "finance_admissions"
  | "contacts"
  | "faq";

export type CampusContentStatus = "draft" | "published" | "archived";

export const CAMPUS_CATEGORY_LABELS: Record<CampusContentCategory, string> = {
  academic: "Academic (calendar, registration, exams)",
  health_safety: "Health & Safety",
  accommodation_transport: "Accommodation & Transport",
  student_services: "Student Services",
  finance_admissions: "Finance & Admissions",
  contacts: "Contacts & Offices",
  faq: "FAQs",
};

export const CAMPUS_CATEGORIES: CampusContentCategory[] = [
  "academic",
  "health_safety",
  "accommodation_transport",
  "student_services",
  "finance_admissions",
  "contacts",
  "faq",
];

export const CAMPUS_STATUS_LABELS: Record<CampusContentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export interface CampusContent {
  id: string;
  tenant_id: string;
  category: CampusContentCategory;
  title: string;
  body: string;
  status: CampusContentStatus;
  sort_order: number;
  author_id: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ClubCategory =
  | "faculty_society"
  | "academic"
  | "sports"
  | "entrepreneurship"
  | "cultural"
  | "religious"
  | "debate"
  | "arts"
  | "music"
  | "volunteering"
  | "other";

export type ClubStatus = "draft" | "published" | "archived";
export type ClubMembershipMode = "open" | "request";
export type ClubMembershipStatus = "pending" | "approved" | "rejected";

export const CLUB_CATEGORY_LABELS: Record<ClubCategory, string> = {
  faculty_society: "Faculty Society",
  academic: "Academic",
  sports: "Sports",
  entrepreneurship: "Entrepreneurship",
  cultural: "Cultural",
  religious: "Religious",
  debate: "Debate",
  arts: "Arts",
  music: "Music",
  volunteering: "Volunteering",
  other: "Other",
};

export const CLUB_CATEGORIES: ClubCategory[] = [
  "faculty_society",
  "academic",
  "sports",
  "entrepreneurship",
  "cultural",
  "religious",
  "debate",
  "arts",
  "music",
  "volunteering",
  "other",
];

export const CLUB_STATUS_LABELS: Record<ClubStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export interface ClubExecutive {
  name: string;
  title: string;
}

export interface ClubSocialLinks {
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
  website?: string;
}

export interface ClubRecord {
  id: string;
  tenant_id: string;
  name: string;
  category: ClubCategory;
  status: ClubStatus;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: ClubSocialLinks;
  executives: ClubExecutive[];
  membership_mode: ClubMembershipMode;
  author_id: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  viewer_follows?: boolean;
  viewer_membership_status?: ClubMembershipStatus | null;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  status: ClubMembershipStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  users?: { first_name: string; last_name: string; school_email: string };
}

export interface ClubAnnouncement {
  id: string;
  club_id: string;
  title: string;
  body: string;
  author_id: string;
  created_at: string;
}

export type DealCategory =
  | "restaurants"
  | "cafes"
  | "food_delivery"
  | "supermarkets"
  | "printing"
  | "bookstores"
  | "transport"
  | "gyms"
  | "fashion"
  | "entertainment"
  | "telecom_data"
  | "technology"
  | "health_wellness";

export type DealStatus = "draft" | "published" | "archived";

export const DEAL_CATEGORY_LABELS: Record<DealCategory, string> = {
  restaurants: "Restaurants",
  cafes: "Cafés",
  food_delivery: "Food Delivery",
  supermarkets: "Supermarkets",
  printing: "Printing",
  bookstores: "Bookstores",
  transport: "Transport",
  gyms: "Gyms",
  fashion: "Fashion",
  entertainment: "Entertainment",
  telecom_data: "Telecom & Data",
  technology: "Technology",
  health_wellness: "Health & Wellness",
};

export const DEAL_CATEGORIES: DealCategory[] = [
  "restaurants",
  "cafes",
  "food_delivery",
  "supermarkets",
  "printing",
  "bookstores",
  "transport",
  "gyms",
  "fashion",
  "entertainment",
  "telecom_data",
  "technology",
  "health_wellness",
];

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export interface DealRecord {
  id: string;
  tenant_id: string;
  merchant_name: string;
  logo_url: string | null;
  category: DealCategory;
  status: DealStatus;
  description: string;
  discount_summary: string;
  eligibility: string | null;
  promo_code: string | null;
  redemption_instructions: string | null;
  locations: string | null;
  starts_at: string | null;
  expires_at: string | null;
  terms: string | null;
  contact_info: string | null;
  external_url: string | null;
  views: number;
  author_id: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  viewer_has_saved?: boolean;
}

export type NotificationKind =
  | "case_status_changed"
  | "case_comment_added"
  | "announcement_published"
  | "event_reminder"
  | "club_announcement"
  | "membership_decided";

export interface NotificationRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  audience_type: AnnouncementAudience;
  audience_faculty_id: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  expires_at: string | null;
  author_id: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  faculties?: { name: string } | null;
  author?: { first_name: string; last_name: string } | null;
}
