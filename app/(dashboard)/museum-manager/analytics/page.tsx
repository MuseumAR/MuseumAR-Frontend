import { AnalyticsPageContent } from "@/components/shared/analytics-page";
import { NoMuseumEmptyState } from "@/components/museum-manager/no-museum-empty-state";
import { getAnalyticsMetrics } from "@/services/analyst";
import { resolveActiveMuseumId } from "@/services/museum-manager/museum-resolve.server";

export default async function AnalyticsPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return (
      <NoMuseumEmptyState description="Register a museum first to view analytics data." />
    );
  }

  const metrics = await getAnalyticsMetrics(museumId);
  return <AnalyticsPageContent metrics={metrics} />;
}
