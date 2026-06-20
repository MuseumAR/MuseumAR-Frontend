"use client";

import { RoleProvider } from "@/context/role-context";
import type { Role } from "@/lib/roles";
import { Sidebar, SIDEBAR_WIDTH } from "./sidebar";
import { TopBar } from "./top-bar";

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <RoleProvider role={role}>
      <div
        className="h-screen overflow-hidden"
        style={{ background: "#F7F2E9", color: "#2B1D0E" }}
      >
        <Sidebar />
        <div
          className="flex h-screen min-w-0 flex-col overflow-hidden"
          style={{ marginLeft: SIDEBAR_WIDTH }}
        >
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
