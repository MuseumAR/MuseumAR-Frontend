import { AnalyticsPageContent } from "@/components/shared/analytics-page";
import { loadAnalyticsPage } from "@/services/analyst";

export default async function AnalyticsPage() {
  const { metrics, dashboard, error } = await loadAnalyticsPage();
  return (
    <AnalyticsPageContent metrics={metrics} dashboard={dashboard} error={error} />
  );
}
