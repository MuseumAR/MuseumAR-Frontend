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
  id: "Mã",
  fullName: "Họ tên",
  email: "Email",
  phone: "Số điện thoại",
  role: "Vai trò",
  loginAt: "Đăng nhập lúc",
  createdAt: "Ngày tạo",
  updatedAt: "Ngày cập nhật",
  status: "Trạng thái",
};

export const ACTIVITY_LOG_LABELS: Labels<ActivityLog> = {
  id: "#",
  user: "Người dùng",
  action: "Hành động",
  time: "Thời gian",
};

export const MUSEUM_APPLICATION_LABELS: Labels<MuseumApplication> = {
  id: "Mã",
  museum: "Bảo tàng",
  submitted: "Ngày gửi",
  status: "Trạng thái",
};

export const MUSEUM_LABELS: Labels<Museum> = {
  id: "Mã",
  name: "Tên bảo tàng",
  location: "Địa điểm",
  manager: "Quản lý",
  status: "Trạng thái",
};

export const ARTIFACT_LABELS: Labels<Artifact> = {
  id: "Mã",
  name: "Tên hiện vật",
  arModel: "Tệp mô hình AR",
  status: "Trạng thái",
  category: "Danh mục",
  era: "Thời kỳ",
  location: "Vị trí",
  qrLinked: "Đã gắn QR",
  arModelStatus: "Mô hình AR",
  audio: "Âm thanh",
  description: "Mô tả",
};

export const ARTIFACT_ROW_LABELS: Labels<ArtifactRow> = {
  id: "Mã",
  name: "Hiện vật",
  category: "Danh mục",
  era: "Thời kỳ lịch sử",
  status: "Trạng thái",
  view: "Lượt xem",
  audioPlay: "Lượt nghe",
  qrScan: "Lượt quét QR",
  arUsage: "Lượt dùng AR",
};

export const ARTIFACT_STATS_LABELS: Labels<ArtifactStats> = {
  arModelsAvailable: "Mô hình AR sẵn có",
  totalArtifact: "Tổng hiện vật",
  visitorsScannedToday: "Lượt quét hôm nay",
};

export const EXHIBITION_LABELS: Labels<Exhibition> = {
  id: "Mã",
  name: "Tên",
  artifacts: "Hiện vật",
  visitors: "Khách tham quan",
  status: "Trạng thái",
};

export const EXHIBITION_APPLICATION_LABELS: Labels<ExhibitionApplication> = {
  id: "Mã",
  title: "Tên",
  exhibitionType: "Loại triển lãm",
  dateStart: "Ngày bắt đầu",
  dateEnd: "Ngày kết thúc",
  openingHours: "Giờ mở cửa",
  closingHours: "Giờ đóng cửa",
  contactEmail: "Email liên hệ",
  description: "Mô tả",
  submitted: "Ngày gửi",
  status: "Trạng thái",
};

export const TICKET_LABELS: Labels<Ticket> = {
  id: "Mã",
  type: "Loại",
  price: "Giá",
  status: "Trạng thái",
};

export const STAFF_LABELS: Labels<StaffMember> = {
  name: "Tên",
  email: "Email",
  roleLabel: "Vai trò",
  status: "Trạng thái",
};

export const MUSEUM_PROFILE_LABELS: Labels<MuseumProfile> = {
  name: "Tên bảo tàng",
  address: "Địa chỉ",
  email: "Email liên hệ",
  phone: "Số điện thoại",
  openingHours: "Giờ mở cửa",
  closingHours: "Giờ đóng cửa",
};

export const MUSEUM_MANAGER_STATS_LABELS: Labels<MuseumManagerStats> = {
  totalVisitor: "Tổng khách tham quan",
  qrScansToday: "Lượt quét QR hôm nay",
  offlineDownloads: "Lượt tải ngoại tuyến",
  averageListeningTime: "Thời gian nghe trung bình",
};
