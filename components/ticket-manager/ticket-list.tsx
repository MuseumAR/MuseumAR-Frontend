"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Search, Trash2, Plus } from "lucide-react";
import type { StandardTicketRow, ExhibitionTicketRow } from "@/lib/mock-data";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const PAGE_SIZE = 8;

const STATUS_STYLES: Record<"Active" | "Inactive", { bg: string; color: string }> = {
  Active: { bg: "rgba(79,125,74,0.12)", color: T.success },
  Inactive: { bg: "rgba(109,90,69,0.12)", color: T.muted },
};

interface TicketTableProps {
  standardTickets: StandardTicketRow[];
  exhibitionTickets: ExhibitionTicketRow[];
}

export function TicketList({ standardTickets, exhibitionTickets }: TicketTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"standard" | "exhibition">("standard");

  const data = activeTab === "standard" ? standardTickets : exhibitionTickets;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => row.ticketName.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-8 px-8 pb-10">
      {/* Standard Tickets Section */}
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
              Manage all tickets for your museum
            </p>
          </div>
          <button
            onClick={() => router.push("/ticket-manager/ticket-management/create")}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all"
            style={{
              background: T.primary,
              color: T.surface,
            }}
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
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                  {activeTab === "standard" ? (
                    <>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        ID
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Ticket Name
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Visitor Type
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Price
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Valid From
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Valid Until
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Status
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Actions
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        ID
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Ticket Name
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Exhibition ID
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Price
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Max Ticket
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Max Quantity
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Valid From
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Valid Until
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Status
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider" style={{ color: T.mutedLight }}>
                        Actions
                      </th>
                    </>
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
                      {activeTab === "standard" ? (
                        <>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                            {(row as StandardTicketRow).id}
                          </td>
                          <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                            {(row as StandardTicketRow).ticketName}
                          </td>
                          <td className="px-5 py-4" style={{ color: T.muted }}>
                            {(row as StandardTicketRow).visitorType}
                          </td>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                            {formatNumber((row as StandardTicketRow).price)}
                          </td>
                          <td className="px-5 py-4" style={{ color: T.muted }}>
                            {(row as StandardTicketRow).validFrom}
                          </td>
                          <td className="px-5 py-4" style={{ color: T.muted }}>
                            {(row as StandardTicketRow).validUntil}
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
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                            {(row as ExhibitionTicketRow).id}
                          </td>
                          <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                            {(row as ExhibitionTicketRow).ticketName}
                          </td>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                            {(row as ExhibitionTicketRow).exhibitionId}
                          </td>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                            {formatNumber((row as ExhibitionTicketRow).price)}
                          </td>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                            {(row as ExhibitionTicketRow).maxTicket}
                          </td>
                          <td className="px-5 py-4 tabular-nums" style={{ color: T.muted }}>
                            {(row as ExhibitionTicketRow).maxQuantity}
                          </td>
                          <td className="px-5 py-4" style={{ color: T.muted }}>
                            {(row as ExhibitionTicketRow).validFrom}
                          </td>
                          <td className="px-5 py-4" style={{ color: T.muted }}>
                            {(row as ExhibitionTicketRow).validUntil}
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
                        </>
                      )}
                    </tr>
                  );
                })}
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
      </section>
    </div>
  );
}
