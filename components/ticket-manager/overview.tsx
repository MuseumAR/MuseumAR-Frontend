import { StatCard } from "@/components/dashboard/stat-card";
import { getTicketStats, getTicketStatisticRows } from "@/services/ticket-manager";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export async function TicketManagerOverview() {
  const [stats, rows] = await Promise.all([
    getTicketStats(),
    getTicketStatisticRows(),
  ]);

  // Get top metrics from statistic rows
  const totalSold = rows.reduce((sum, r) => sum + r.total, 0);
  const avgDailySales = Math.round(totalSold / rows.length);

  return (
    <div className="space-y-8 px-8 pb-10">
      {/* Overview stats */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Ticket Overview
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Ticket Statistics
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Tickets Sold"
            value={stats.totalTicketsSold}
            icon="box"
            growth={15}
            watermark="vase"
          />
          <StatCard
            label="Active Tickets"
            value={stats.activeTickets}
            icon="layers"
            growth={8}
            watermark="scroll"
          />
          <StatCard
            label="Inactive Tickets"
            value={stats.inactiveTickets}
            icon="users"
            growth={2}
            watermark="column"
          />
          <StatCard
            label="Avg Daily Sales"
            value={avgDailySales}
            icon="barChart"
            growth={12}
            watermark="map"
          />
        </div>
      </section>

      {/* Sales Summary */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Summary
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Quick Overview
          </h2>
        </div>
        <div
          className="rounded-3xl p-6"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm" style={{ color: T.mutedLight }}>
                Total Revenue
              </p>
              <p className="text-2xl font-semibold" style={{ color: T.text }}>
                {(stats.totalRevenue / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: T.mutedLight }}>
                Total Tickets in Period
              </p>
              <p className="text-2xl font-semibold" style={{ color: T.text }}>
                {totalSold}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: T.mutedLight }}>
                Data Period
              </p>
              <p className="text-2xl font-semibold" style={{ color: T.text }}>
                {rows.length} days
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
