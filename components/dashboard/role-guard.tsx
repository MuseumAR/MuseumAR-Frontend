"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getHomePathForRole, type DashboardRole } from "@/lib/roles";

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

  const hasAccess = isAuthenticated && user?.roleName === allowedRole;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && user.roleName !== allowedRole) {
      router.replace(getHomePathForRole(user.roleName));
    }
  }, [isLoading, isAuthenticated, user, allowedRole, router]);

  if (isLoading || !hasAccess) {
    return <DashboardLoading />;
  }

  return children;
}
