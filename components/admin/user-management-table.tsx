"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
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
    <>
      <PageHeader title="User Management" icon="user_management" />
      <div className="space-y-5 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-full border border-white/25 bg-transparent py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50"
            />
          </div>
          <button
            type="button"
            className="ml-auto rounded-lg border border-white/25 px-4 py-2.5 text-sm text-white transition-colors hover:border-white/50"
          >
            Create new user
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={deactivateSelected}
            disabled={selected.size === 0}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            Deactivate
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/25">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-white/60">
                <th className="px-4 py-3 font-normal">
                  <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} className="accent-white" />
                </th>
                <th className="px-4 py-3 font-normal">Id</th>
                <th className="px-4 py-3 font-normal">Full Name</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Phone</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Login At</th>
                <th className="px-4 py-3 font-normal">Created At</th>
                <th className="px-4 py-3 font-normal">Updated At</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} className="accent-white" />
                  </td>
                  <td className="px-4 py-3 tabular-nums">{user.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{user.fullName}</td>
                  <td className="px-4 py-3 text-white/70">{user.email}</td>
                  <td className="px-4 py-3 tabular-nums">{user.phone}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3 tabular-nums text-white/70">{user.loginAt}</td>
                  <td className="px-4 py-3 tabular-nums text-white/70">{user.createdAt}</td>
                  <td className="px-4 py-3 tabular-nums text-white/70">{user.updatedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${user.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors ${p === currentPage ? "border-white bg-white text-black" : "border-white/25 text-white/70 hover:border-white/50"}`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 text-white/70 hover:border-white/50 disabled:opacity-30"
            aria-label="Next page"
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}
