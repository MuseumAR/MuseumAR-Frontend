"use client";

import type { DashboardRole } from "@/lib/roles";
import { Sidebar, SIDEBAR_WIDTH } from "./sidebar";
import { TopBar } from "./top-bar";

export function DashboardShell({
  role,
  children,
}: {
  role: DashboardRole;
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-screen overflow-hidden"
      style={{ background: "#F7F2E9", color: "#2B1D0E" }}
    >
      <Sidebar role={role} />
      <div
        className="flex h-screen min-w-0 flex-col overflow-hidden"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
