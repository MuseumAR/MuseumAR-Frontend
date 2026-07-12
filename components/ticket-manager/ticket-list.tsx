"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import type { TicketTypeDto } from "@/types/api";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const PAGE_SIZE = 8;

type StatusLabel = "Active" | "Inactive";

const STATUS_STYLES: Record<StatusLabel, { bg: string; color: string }> = {
  Active: { bg: "rgba(79,125,74,0.12)", color: T.success },
  Inactive: { bg: "rgba(109,90,69,0.12)", color: T.muted },
};

function statusOf(ticket: TicketTypeDto): StatusLabel {
  return ticket.isActive === false ? "Inactive" : "Active";
}

export function TicketList({ ticketTypes }: { ticketTypes: TicketTypeDto[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"standard" | "exhibition">("standard");

  const { standard, exhibition } = useMemo(() => {
    const standard: TicketTypeDto[] = [];
    const exhibition: TicketTypeDto[] = [];
    for (const ticket of ticketTypes) {
      if (ticket.exhibitionId == null) standard.push(ticket);
      else exhibition.push(ticket);
    }
    return { standard, exhibition };
  }, [ticketTypes]);

  const data = activeTab === "standard" ? standard : exhibition;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => row.name.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns =
    activeTab === "standard"
      ? ["ID", "Name", "Price", "Description", "Status"]
      : ["ID", "Name", "Exhibition ID", "Price", "Description", "Status"];

  return (
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: cinzel, color: T.text }}
            >
              Ticket Management
            </h3>
            <p className="mt-1 text-sm" style={{ color: T.muted }}>
              Manage all ticket types for your museum
            </p>
          </div>
          <button
            onClick={() => router.push("/ticket-manager/ticket-management/create")}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all"
            style={{ background: T.primary, color: T.surface }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            <Plus className="h-4 w-4" />
            Create new ticket
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-2">
          {(["standard", "exhibition"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className="px-4 py-2 text-sm font-medium transition-all rounded-lg capitalize"
              style={{
                background: activeTab === tab ? T.primary : T.surface,
                color: activeTab === tab ? T.surface : T.muted,
                border: `1px solid ${activeTab === tab ? T.primary : T.border}`,
              }}
            >
              {tab === "standard" ? "Standard Ticket" : "Exhibition Ticket"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs mb-5">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: T.mutedLight }}
          />
          <input
            type="search"
            placeholder="Search tickets..."
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

        {/* Table */}
        <div
          className="overflow-hidden rounded-3xl"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {columns.map((label) => (
                    <th
                      key={label}
                      className="px-5 py-4 text-xs font-medium uppercase tracking-wider"
                      style={{ color: T.mutedLight }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-5 py-16 text-center text-sm"
                      style={{ color: T.muted }}
                    >
                      No ticket types yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const status = statusOf(row);
                    const statusStyle = STATUS_STYLES[status];
                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-[rgba(200,155,69,0.05)]"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                      >
                        <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                          {row.id}
                        </td>
                        <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                          {row.name}
                        </td>
                        {activeTab === "exhibition" && (
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                            {row.exhibitionId}
                          </td>
                        )}
                        <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                          {formatNumber(row.price)}
                        </td>
                        <td
                          className="max-w-[240px] truncate px-5 py-4"
                          style={{ color: T.muted }}
                        >
                          {row.description ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
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
        )}
      </section>
    </div>
  );
}
