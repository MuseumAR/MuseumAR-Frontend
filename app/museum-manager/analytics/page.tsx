import { AnalyticsPageContent } from "@/components/shared/analytics-page";
import { getAnalyticsMetrics } from "@/services/analytics.service";

export default async function AnalyticsPage() {
  const metrics = await getAnalyticsMetrics();
  return <AnalyticsPageContent metrics={metrics} />;
}
