"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getEffectiveRoleName, setDevRoleOverride } from "@/lib/dev-role-override";
import { getHomePathForRole, isDashboardRole, type DashboardRole } from "@/lib/roles";

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
  const [, setDevRoleTick] = useState(0);

  const effectiveRole = user ? getEffectiveRoleName(user.roleName) : null;
  const hasAccess = isAuthenticated && effectiveRole === allowedRole;

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const params = new URLSearchParams(window.location.search);
    const devRole = params.get("devRole")?.trim();
    if (!devRole || !isDashboardRole(devRole)) return;

    setDevRoleOverride(devRole);
    params.delete("devRole");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    const onDevRoleChanged = () => setDevRoleTick((n) => n + 1);
    window.addEventListener("museumar-dev-role-changed", onDevRoleChanged);
    return () =>
      window.removeEventListener("museumar-dev-role-changed", onDevRoleChanged);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && effectiveRole !== allowedRole) {
      router.replace(getHomePathForRole(effectiveRole));
    }
  }, [isLoading, isAuthenticated, user, effectiveRole, allowedRole, router]);

  if (isLoading || !hasAccess) {
    return <DashboardLoading />;
  }

  return children;
}
