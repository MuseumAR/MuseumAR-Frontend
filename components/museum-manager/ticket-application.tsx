import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import { TICKET_LABELS } from "@/lib/field-labels";
import type { Ticket } from "@/types";

export function TicketApplicationTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="px-8 pb-10">
      <PageDescription>Ticket catalog and status</PageDescription>
      <div className="overflow-hidden rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{TICKET_LABELS.id}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{TICKET_LABELS.type}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{TICKET_LABELS.price}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{TICKET_LABELS.status}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                <td className="px-5 py-4" style={{ color: T.text }}>{ticket.id}</td>
                <td className="px-5 py-4" style={{ color: T.text }}>{ticket.type}</td>
                <td className="px-5 py-4" style={{ color: T.muted }}>{ticket.price}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{
                    background: ticket.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.15)",
                    color: ticket.status === "Active" ? T.success : T.primaryDark,
                  }}>{ticket.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
