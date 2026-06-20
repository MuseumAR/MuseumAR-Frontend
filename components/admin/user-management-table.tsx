"use client";

import { useState } from "react";
import { USER_LABELS } from "@/lib/field-labels";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import type { User } from "@/types";

const PAGE_SIZE = 10;

export function UserManagementTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(rows.map((u) => u.id)) : new Set());

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const deactivateSelected = () => {
    setUsers((prev) =>
      prev.map((u) => (selected.has(u.id) ? { ...u, status: "Inactive" as const } : u)),
    );
    setSelected(new Set());
  };

  const allChecked = rows.length > 0 && rows.every((u) => selected.has(u.id));

  return (
    <div className="space-y-5 px-8 pb-10">
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm rounded-2xl py-2.5 px-4 text-sm outline-none"
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
        />
        <button
          type="button"
          className="ml-auto rounded-2xl px-4 py-2.5 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          Create new user
        </button>
      </div>

      <button
        type="button"
        onClick={deactivateSelected}
        disabled={selected.size === 0}
        className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
        style={{ background: T.danger, color: T.surface }}
      >
        Deactivate
      </button>

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
              <th className="px-4 py-3"><input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} /></th>
              <th className="px-4 py-3 font-medium" style={{ color: T.mutedLight }}>{USER_LABELS.id}</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.mutedLight }}>{USER_LABELS.fullName}</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.mutedLight }}>{USER_LABELS.email}</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.mutedLight }}>{USER_LABELS.phone}</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.mutedLight }}>{USER_LABELS.role}</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.mutedLight }}>{USER_LABELS.status}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} />
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: T.text }}>{user.id}</td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: T.text }}>{user.fullName}</td>
                <td className="px-4 py-3" style={{ color: T.muted }}>{user.email}</td>
                <td className="px-4 py-3 tabular-nums" style={{ color: T.text }}>{user.phone}</td>
                <td className="px-4 py-3" style={{ color: T.text }}>{user.role}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: user.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(180,83,9,0.12)",
                      color: user.status === "Active" ? T.success : T.danger,
                    }}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-lg px-3 py-1 text-xs font-medium"
                    style={{ background: "rgba(200,155,69,0.15)", color: T.primaryDark }}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
