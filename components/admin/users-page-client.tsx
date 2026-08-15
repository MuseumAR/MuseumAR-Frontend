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
      setError(getDisplayError(err, "Unable to load users."));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then((data) => {
        if (cancelled) return;
        setUsers(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getDisplayError(err, "Unable to load users."));
        setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && users.length === 0) {
    return (
      <div className="px-8 pb-10">
        <p className="text-sm" style={{ color: T.muted }}>
          Loading users…
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
