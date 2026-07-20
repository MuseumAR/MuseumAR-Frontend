import { AnalyticsPageContent } from "@/components/shared/analytics-page";
import { getAnalyticsMetrics, getAnalyticsDashboard } from "@/services/analyst";

export default async function AnalyticsPage() {
  const [metrics, dashboard] = await Promise.all([
    getAnalyticsMetrics(),
    getAnalyticsDashboard(),
  ]);
  return <AnalyticsPageContent metrics={metrics} dashboard={dashboard} />;
}
