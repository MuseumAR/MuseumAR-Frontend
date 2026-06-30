import { TicketStatisticTable } from "./ticket-statistic-table";
import { getTicketStatisticRows } from "@/services/ticket-manager";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export async function TicketStatistic() {
  const rows = await getTicketStatisticRows();

  return (
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Sales Report
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Ticket Sales by Category
          </h2>
        </div>
        <TicketStatisticTable data={rows} />
      </section>
    </div>
  );
}
