// ─── User ──────────────────────────────────────────────────────────────────
export type UserStatus = "Active" | "Inactive";
export type UserRole = "Admin" | "Content Manager" | "Museum Manager" | "User";

export type User = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  loginAt: string;
  createdAt: string;
  updatedAt: string;
  status: UserStatus;
};

// ─── Activity Log ──────────────────────────────────────────────────────────
export type ActivityLog = {
  id: number;
  user: string;
  action: string;
  time: string;
};

// ─── Museum Application ────────────────────────────────────────────────────
export type ApplicationStatus = "Pending" | "Approved" | "Rejected";

export type MuseumApplication = {
  id: string;
  museum: string;
  submitted: string;
  status: ApplicationStatus;
};

// ─── Museum Management ─────────────────────────────────────────────────────
export type Museum = {
  id: number;
  name: string;
  location: string;
  manager: string;
  status: "Active" | "Inactive";
};

// ─── Artifact ──────────────────────────────────────────────────────────────
export type ActiveInactive = "Active" | "Inactive";

export type Artifact = {
  id: string;
  name: string;
  arModel: string;
  status: "Published" | "Draft" | "Pending";
  category: string;
  era: string;
  location: string;
  qrLinked: ActiveInactive;
  arModelStatus: ActiveInactive;
  audio: ActiveInactive;
  image: string | null;
  description: string;
};

export type ArtifactRow = {
  id: number;
  name: string;
  view: number;
  audioPlay: number;
  qrScan: number;
  arUsage: number;
};

export type ArtifactStats = {
  arModelsAvailable: number;
  totalArtifact: number;
  visitorsScannedToday: number;
};

// ─── Exhibition ────────────────────────────────────────────────────────────
export type Exhibition = {
  id: number;
  name: string;
  artifacts: number;
  visitors: number;
  status: "Active" | "Upcoming" | "Closed";
};

export type ExhibitionApplication = {
  id: string;
  title: string;
  exhibitionType: string;
  dateStart: string;
  dateEnd: string;
  openingHours: string;
  closingHours: string;
  contactEmail: string;
  description: string;
  image: string | null;
  submitted: string;
  status: ApplicationStatus;
};

// ─── Ticket ────────────────────────────────────────────────────────────────
export type Ticket = {
  id: string;
  type: string;
  price: string;
  status: "Active" | "Draft";
};

// ─── Staff ─────────────────────────────────────────────────────────────────
export type StaffMember = {
  name: string;
  email: string;
  roleLabel: string;
  status: "Active" | "Inactive";
};

// ─── Analytics ─────────────────────────────────────────────────────────────
export type AnalyticsMetric = {
  label: string;
  value: string;
  change: string;
};

// ─── Museum Profile ────────────────────────────────────────────────────────
export type MuseumProfile = {
  name: string;
  address: string;
  email: string;
  phone: string;
  openingHours: string;
  closingHours: string;
  image: string | null;
};

// ─── Museum Manager Stats / Charts ─────────────────────────────────────────
export type MuseumManagerStats = {
  totalVisitor: number;
  qrScansToday: number;
  offlineDownloads: number;
  averageListeningTime: number;
};

export type PopularExhibit = {
  name: string;
  value: number;
  color: string;
};

export type LanguageUsage = {
  name: string;
  percent: number;
  color: string;
};

export type VisitorTrend = {
  day: string;
  value: number;
};
