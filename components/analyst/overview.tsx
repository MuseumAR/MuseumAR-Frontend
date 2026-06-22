import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getAnalyticsMetrics } from "@/services/analyst";

export async function AnalystOverview() {
  const metrics = await getAnalyticsMetrics();

  return (
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Analyst Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Reports & Exports
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl px-6 py-5"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <p className="text-sm" style={{ color: T.muted }}>{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: T.text }}>
                {metric.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: T.mutedLight }}>{metric.change}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
