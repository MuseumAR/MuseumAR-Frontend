const SEGMENT_TITLES: Record<string, string> = {
  overview: "Tổng quan",
  "museum-profile": "Hồ sơ bảo tàng",
  analytics: "Phân tích",
  "staff-management": "Quản lý nhân sự",
  artifact: "Hiện vật",
  "exhibition-application": "Đăng ký triển lãm",
  "ticket-application": "Quản lý vé",
  exhibition: "Triển lãm",
  "content-versions": "Phiên bản nội dung",
  "offline-packages": "Gói ngoại tuyến",
  "maps-routes": "Bản đồ & Lộ trình",
  users: "Người dùng",
  "museum-management": "Hồ sơ bảo tàng",
  "ticket-types": "Loại vé",
  "audit-logs": "Nhật ký hệ thống",
  taxonomy: "Phân loại",
  "system-config": "Cấu hình hệ thống",
  create: "Tạo mới",
  edit: "Chỉnh sửa",
};

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const prev = segments[segments.length - 2];

  if (last && SEGMENT_TITLES[last]) {
    if (last === "create" || last === "edit") {
      return `${SEGMENT_TITLES[prev] ?? "Trang"} · ${SEGMENT_TITLES[last]}`;
    }
    return SEGMENT_TITLES[last];
  }

  if (/^ART-/.test(last ?? "")) return "Chi tiết hiện vật";
  if (/^\d+$/.test(last ?? "") && segments.includes("exhibition")) {
    return "Chi tiết triển lãm";
  }
  return "Bảng điều khiển";
}
