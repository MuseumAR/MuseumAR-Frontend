"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import type { ArtifactRow } from "@/types";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const PAGE_SIZE = 8;

const STATUS_STYLES: Record<ArtifactRow["status"], { bg: string; color: string }> = {
  Published: { bg: "rgba(79,125,74,0.12)", color: T.success },
  Draft: { bg: "rgba(200,155,69,0.15)", color: T.primaryDark },
  Archived: { bg: "rgba(109,90,69,0.12)", color: T.muted },
};

export function ArtifactTable({ data }: { data: ArtifactRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.era.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Artifact Catalog
          </h3>
          <p className="mt-1 text-sm" style={{ color: T.muted }}>
            Museum collection registry with engagement metrics
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: T.mutedLight }}
          />
          <input
            type="search"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>
      </div>

      <div
        className="overflow-hidden rounded-3xl"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                {["Artifact", "Category", "Views", "Audio Plays", "QR Scans", "AR Usage", "Status", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-4 text-xs font-medium uppercase tracking-wider"
                      style={{ color: T.mutedLight }}
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const statusStyle = STATUS_STYLES[row.status];
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-[rgba(200,155,69,0.05)]"
                    style={{ borderBottom: `1px solid ${T.border}` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                          style={{
                            background: "rgba(200,155,69,0.10)",
                            border: `1px solid ${T.border}`,
                          }}
                        >
                          {row.image ? (
                            <img src={row.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold" style={{ color: T.primaryDark }}>
                              #{row.id}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: T.text }}>
                            {row.name}
                          </p>
                          <p className="text-xs" style={{ color: T.mutedLight }}>
                            {row.era}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>
                      {row.category}
                    </td>
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {formatNumber(row.view)}
                    </td>
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {formatNumber(row.audioPlay)}
                    </td>
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {formatNumber(row.qrScan)}
                    </td>
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {formatNumber(row.arUsage)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {[Eye, Pencil, Trash2].map((Icon, i) => (
                          <button
                            key={i}
                            type="button"
                            className="rounded-lg p-2 transition-colors"
                            style={{ color: i === 2 ? T.danger : T.muted }}
                            aria-label={i === 0 ? "View" : i === 1 ? "Edit" : "Delete"}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(200,155,69,0.12)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors"
            style={{
              background: p === currentPage ? T.primary : T.surface,
              color: p === currentPage ? T.surface : T.muted,
              border: `1px solid ${p === currentPage ? T.primary : T.border}`,
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
