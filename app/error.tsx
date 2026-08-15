"use client";

import { AppStatusPage } from "@/components/shared/app-status-page";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppStatusPage
      title="Đã xảy ra lỗi"
      description="Không tải được trang. Thử lại, hoặc quay về trang chủ nếu sự cố vẫn tiếp diễn."
      primaryLabel="Thử lại"
      primaryAsButton
      onPrimary={reset}
      secondaryHref="/"
      secondaryLabel="Về trang chủ"
    />
  );
}
