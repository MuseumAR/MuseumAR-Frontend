const STATUS_LABELS: Record<string, string> = {
  Active: "Đang hoạt động",
  Inactive: "Ngừng hoạt động",
  Published: "Đã xuất bản",
  Draft: "Nháp",
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Ended: "Đã kết thúc",
  Building: "Đang tạo",
  Available: "Sẵn sàng",
  Paid: "Đã thanh toán",
  Used: "Đã sử dụng",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
  Scheduled: "Đã lên lịch",
  Paused: "Tạm dừng",
  Percentage: "Phần trăm",
  FixedAmount: "Số tiền cố định",
  SystemAdmin: "Quản trị hệ thống",
  MuseumManager: "Quản lý bảo tàng",
  ContentManager: "Quản lý nội dung",
  Visitor: "Khách tham quan",
};

export function labelStatus(status?: string | null): string {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}
