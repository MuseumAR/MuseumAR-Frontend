"use client";

import { AppStatusPage } from "@/components/shared/app-status-page";

export default function DashboardErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppStatusPage
      title="Đã xảy ra lỗi"
      description="Không tải được trang này. Thử lại hoặc quay về trang chủ."
      primaryLabel="Thử lại"
      primaryAsButton
      onPrimary={reset}
      secondaryHref="/"
      secondaryLabel="Trang chủ"
    />
  );
}
