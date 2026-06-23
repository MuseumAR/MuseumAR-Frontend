import { Suspense } from "react";
import ResetPasswordPage from "./reset-password-client";

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#F5E6C8" }}>
      <p className="text-sm" style={{ color: "#6D5A45" }}>
        Loading...
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
