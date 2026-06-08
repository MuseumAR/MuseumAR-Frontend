import { PageHeader } from "@/components/dashboard/page-header";
import type { Ticket } from "@/types";

export function TicketApplicationTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <>
      <PageHeader title="Ticket Application" icon="ticket_application" />
      <div className="px-8 py-8">
        <div className="overflow-hidden rounded-2xl border border-white/25">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-white/70">
                <th className="px-5 py-4 font-normal">ID</th>
                <th className="px-5 py-4 font-normal">Type</th>
                <th className="px-5 py-4 font-normal">Price</th>
                <th className="px-5 py-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-4">{ticket.id}</td>
                  <td className="px-5 py-4">{ticket.type}</td>
                  <td className="px-5 py-4">{ticket.price}</td>
                  <td className="px-5 py-4">{ticket.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
