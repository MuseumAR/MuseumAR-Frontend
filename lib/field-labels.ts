import type {
  User,
  ActivityLog,
  MuseumApplication,
  Museum,
  Artifact,
  ArtifactRow,
  ArtifactStats,
  Exhibition,
  ExhibitionApplication,
  Ticket,
  StaffMember,
  MuseumProfile,
  MuseumManagerStats,
} from "@/types";

type Labels<T> = Partial<Record<keyof T, string>>;

export const USER_LABELS: Labels<User> = {
  id: "Id",
  fullName: "Full Name",
  email: "Email",
  phone: "Phone",
  role: "Role",
  loginAt: "Login At",
  createdAt: "Created At",
  updatedAt: "Updated At",
  status: "Status",
};

export const ACTIVITY_LOG_LABELS: Labels<ActivityLog> = {
  id: "#",
  user: "User",
  action: "Action",
  time: "Time",
};

export const MUSEUM_APPLICATION_LABELS: Labels<MuseumApplication> = {
  id: "ID",
  museum: "Museum",
  submitted: "Submitted",
  status: "Status",
};

export const MUSEUM_LABELS: Labels<Museum> = {
  id: "ID",
  name: "Museum Name",
  location: "Location",
  manager: "Manager",
  status: "Status",
};

export const ARTIFACT_LABELS: Labels<Artifact> = {
  id: "ID",
  name: "Artifact Name",
  arModel: "AR Model File",
  status: "Status",
  category: "Category",
  era: "Era",
  location: "Location",
  qrLinked: "QR Linked",
  arModelStatus: "AR Model",
  audio: "Audio",
  description: "Description",
};

export const ARTIFACT_ROW_LABELS: Labels<ArtifactRow> = {
  id: "Id",
  name: "Artifact",
  category: "Category",
  era: "Historical Period",
  status: "Status",
  view: "Views",
  audioPlay: "Audio Plays",
  qrScan: "QR Scans",
  arUsage: "AR Usage",
};

export const ARTIFACT_STATS_LABELS: Labels<ArtifactStats> = {
  arModelsAvailable: "AR Models Available",
  totalArtifact: "Total Artifact",
  visitorsScannedToday: "Visitors Scanned Today",
};

export const EXHIBITION_LABELS: Labels<Exhibition> = {
  id: "ID",
  name: "Name",
  artifacts: "Artifacts",
  visitors: "Visitors",
  status: "Status",
};

export const EXHIBITION_APPLICATION_LABELS: Labels<ExhibitionApplication> = {
  id: "ID",
  title: "Name",
  exhibitionType: "Exhibition Type",
  dateStart: "Date Start",
  dateEnd: "Date End",
  openingHours: "Opening Hours",
  closingHours: "Closing Hours",
  contactEmail: "Contact Email",
  description: "Description",
  submitted: "Submitted",
  status: "Status",
};

export const TICKET_LABELS: Labels<Ticket> = {
  id: "ID",
  type: "Type",
  price: "Price",
  status: "Status",
};

export const STAFF_LABELS: Labels<StaffMember> = {
  name: "Name",
  email: "Email",
  roleLabel: "Role",
  status: "Status",
};

export const MUSEUM_PROFILE_LABELS: Labels<MuseumProfile> = {
  name: "Museum Name",
  address: "Address",
  email: "Contact Email",
  phone: "Phone Number",
  openingHours: "Opening Hours",
  closingHours: "Closing Hours",
};

export const MUSEUM_MANAGER_STATS_LABELS: Labels<MuseumManagerStats> = {
  totalVisitor: "Total Visitor",
  qrScansToday: "QR Scans Today",
  offlineDownloads: "Offline Downloads",
  averageListeningTime: "Average Listening Time",
};
