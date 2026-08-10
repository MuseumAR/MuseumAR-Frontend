"use client";

import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { TicketTypeDto } from "@/types/api";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TicketTypeManagementPanel({
  ticketTypes,
  museumName,
}: {
  ticketTypes: TicketTypeDto[];
  museumId?: number | null;
  museumName?: string | null;
}) {
  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {ticketTypes.length}
          </span>
          {` ticket type${ticketTypes.length === 1 ? "" : "s"}`}
          {museumName ? (
            <span style={{ color: T.mutedLight }}>{` · ${museumName}`}</span>
          ) : null}
        </p>
      </div>

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {ticketTypes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              No ticket types yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {["ID", "Name", "Price", "Exhibition ID", "Description", "Status"].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-4 font-medium"
                      style={{ color: T.mutedLight }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    className="hover:bg-[rgba(200,155,69,0.05)]"
                  >
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {ticket.id}
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                      {ticket.name}
                    </td>
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {formatPrice(ticket.price)}
                    </td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>
                      {ticket.exhibitionId ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-4" style={{ color: T.muted }}>
                      {ticket.description ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background:
                            ticket.status === "Approved"
                              ? "rgba(79,125,74,0.12)"
                              : "rgba(200,155,69,0.15)",
                          color: ticket.status === "Approved" ? T.success : T.primaryDark,
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

