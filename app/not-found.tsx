import { AppStatusPage } from "@/components/shared/app-status-page";

export default function NotFound() {
  return (
    <AppStatusPage
      title="Không tìm thấy trang"
      description="Đường dẫn không tồn tại hoặc nội dung đã bị xóa. Kiểm tra lại link, hoặc quay về trang chủ / vé của bạn."
      primaryHref="/"
      primaryLabel="Về trang chủ"
      secondaryHref="/tickets"
      secondaryLabel="Vé tham quan"
    />
  );
}
