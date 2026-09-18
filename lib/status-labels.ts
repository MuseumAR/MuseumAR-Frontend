/** Visible labels for API status/enum values. Stored values stay unchanged. */
const STATUS_VI: Record<string, string> = {
  Active: "Hoạt động",
  Inactive: "Không hoạt động",
  Published: "Đã xuất bản",
  Draft: "Nháp",
  Archived: "Lưu trữ",
  Pending: "Chờ xử lý",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Available: "Sẵn sàng",
  Building: "Đang tạo",
  Failed: "Thất bại",
  Ended: "Đã kết thúc",
  Upcoming: "Sắp diễn ra",
  Closed: "Đã đóng",
  Used: "Đã dùng",
  Unused: "Chưa dùng",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
  Paid: "Đã thanh toán",
  Unpaid: "Chưa thanh toán",
  Refunded: "Đã hoàn",
  SystemAdmin: "Quản trị hệ thống",
  MuseumManager: "Quản lý bảo tàng",
  ContentManager: "Quản lý nội dung",
  Visitor: "Khách tham quan",
  Percentage: "Phần trăm",
  FixedAmount: "Số tiền cố định",
};

export function labelStatus(status?: string | null): string {
  if (!status) return "—";
  return STATUS_VI[status] ?? status;
}
