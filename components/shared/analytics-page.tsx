import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { AnalyticsMetric } from "@/types";
import { AnalyticsCharts } from "./analytics-charts";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { MuseumDashboardDto } from "@/types/api";

interface Props {
  metrics: AnalyticsMetric[];
  dashboard?: MuseumDashboardDto | null;
  error?: string | null;
}

function hasDelta(change: string) {
  return change.startsWith("+") || change.startsWith("-");
}

export function AnalyticsPageContent({ metrics, dashboard, error }: Props) {
  return (
    <div className="space-y-8 px-8 pb-10">
      {error ? (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      ) : null}

      <section>
        <div className="mb-5">
          <p
            className="text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: T.mutedLight }}
          >
            Key Metrics
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Performance Overview
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {(metrics.length > 0
              ? metrics
              : [
                  { label: "Total QR scans", value: "0", change: "—" },
                  { label: "Average listening time", value: "0 min", change: "—" },
                  { label: "Offline downloads", value: "0", change: "—" },
                  { label: "Popular exhibits", value: "0", change: "—" },
                ]
            ).map((metric) => {
              const delta = hasDelta(metric.change);
              const positive = metric.change.startsWith("+");
              return (
                <div
                  key={metric.label}
                  className="relative overflow-hidden rounded-3xl p-6"
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    boxShadow: "0 8px 24px rgba(43,29,14,0.06)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm" style={{ color: T.muted }}>
                      {metric.label}
                    </p>
                    {delta ? (
                      <div
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: positive
                            ? "rgba(79,125,74,0.10)"
                            : "rgba(180,83,9,0.10)",
                          color: positive ? T.success : T.danger,
                        }}
                      >
                        {positive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {metric.change}
                      </div>
                    ) : null}
                  </div>

                  <p
                    className="mt-4 text-3xl font-semibold tabular-nums"
                    style={{ fontFamily: cinzel, color: T.text }}
                  >
                    {metric.value}
                  </p>
                </div>
              );
            })}
          </div>
      </section>

      <section>
        <div className="mb-5">
          <p
            className="text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: T.mutedLight }}
          >
            Detailed Analytics
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Engagement Analytics
          </h2>
        </div>
        <AnalyticsCharts dashboard={dashboard} />
      </section>
    </div>
  );
}
