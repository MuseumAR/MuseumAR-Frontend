"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getHomePathForRole, canonicalRoleName, type DashboardRole } from "@/lib/roles";
import { currentPathForNext, loginUrl } from "@/lib/login-redirect";

function DashboardLoading() {
  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: "#F7F2E9", color: "#7D5A3C" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#C89B3C", borderRightColor: "#C89B3C" }}
        />
        <p className="text-sm">Loading dashboard…</p>
      </div>
    </div>
  );
}

export function RoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: DashboardRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const role = canonicalRoleName(user?.roleName ?? "");
  const hasAccess = isAuthenticated && role === allowedRole;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(loginUrl(currentPathForNext()));
      return;
    }

    if (user && role !== allowedRole) {
      router.replace(getHomePathForRole(user.roleName));
    }
  }, [isLoading, isAuthenticated, user, role, allowedRole, router]);

  if (isLoading || !hasAccess) {
    return <DashboardLoading />;
  }

  return children;
}
