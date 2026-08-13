"use client";

import { useCallback, useEffect, useState } from "react";
import { UserManagementPanel } from "@/components/admin/user-management";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { getUsers } from "@/services/admin/admin-api.service";
import type { UserResponseDto } from "@/types/api";

/** Loads users on the client so auth token from localStorage is available. */
export function UsersPageClient() {
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tải người dùng."));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && users.length === 0) {
    return (
      <div className="px-8 pb-10">
        <p className="text-sm" style={{ color: T.muted }}>
          Đang tải người dùng…
        </p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="px-8 pb-10">
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      </div>
    );
  }

  return <UserManagementPanel users={users} onMutated={load} />;
}
