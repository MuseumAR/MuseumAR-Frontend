import { PageHeader } from "@/components/dashboard/page-header";
import type { AnalyticsMetric } from "@/types";

interface Props {
  metrics: AnalyticsMetric[];
}

export function AnalyticsPageContent({ metrics }: Props) {
  return (
    <>
      <PageHeader title="Analytics" icon="analytics" />
      <div className="grid gap-4 px-8 py-8 md:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/25 p-6">
            <p className="text-sm text-white/70">{metric.label}</p>
            <p className="mt-2 text-3xl font-light">{metric.value}</p>
            <p
              className={`mt-2 text-sm ${
                metric.change.startsWith("+") ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {metric.change} vs last month
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
