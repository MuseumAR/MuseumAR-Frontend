import { Suspense } from "react";
import VerifyEmailPage from "./verify-email-client";

function VerifyEmailFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#F5E6C8" }}>
      <p className="text-sm" style={{ color: "#6D5A45" }}>
        Đang tải...
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailPage />
    </Suspense>
  );
}
