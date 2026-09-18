import { AppStatusPage } from "@/components/shared/app-status-page";

export default function DashboardNotFound() {
  return (
    <AppStatusPage
      title="Không tìm thấy trang"
      description="Bản ghi hoặc đường dẫn này không tồn tại, hoặc đã bị xóa."
      primaryHref="/"
      primaryLabel="Trang chủ"
    />
  );
}
