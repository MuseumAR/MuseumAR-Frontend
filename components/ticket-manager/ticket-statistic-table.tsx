"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { TicketStatisticRow } from "@/lib/mock-data";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const PAGE_SIZE = 10;

interface TicketStatisticProps {
  data: TicketStatisticRow[];
}

export function TicketStatisticTable({ data }: TicketStatisticProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => row.date.includes(q));
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
            Ticket Sales Statistics
          </h3>
          <p className="mt-1 text-sm" style={{ color: T.muted }}>
            Daily ticket sales by category
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: T.mutedLight }}
          />
          <input
            type="search"
            placeholder="Search by date..."
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
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                {["Children Ticket", "Student Ticket", "Adult Ticket", "Total", "Date"].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-4 text-xs font-medium uppercase tracking-wider"
                    style={{ color: T.mutedLight }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.date}
                  className="transition-colors hover:bg-[rgba(200,155,69,0.05)]"
                  style={{ borderBottom: `1px solid ${T.border}` }}
                >
                  <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                    {formatNumber(row.childrenTicket)}
                  </td>
                  <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                    {formatNumber(row.studentTicket)}
                  </td>
                  <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                    {formatNumber(row.adultTicket)}
                  </td>
                  <td className="px-5 py-4 tabular-nums font-semibold" style={{ color: T.primary }}>
                    {formatNumber(row.total)}
                  </td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
