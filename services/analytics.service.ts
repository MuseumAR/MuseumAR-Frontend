import type { AnalyticsMetric } from "@/types";

const MOCK_METRICS: AnalyticsMetric[] = [
  { label: "Total AR sessions", value: "42,380", change: "+12%" },
  { label: "Avg. session duration", value: "4m 32s", change: "+5%" },
  { label: "QR scan conversion", value: "68%", change: "+3%" },
  { label: "Audio completion rate", value: "54%", change: "-2%" },
];

export async function getAnalyticsMetrics(): Promise<AnalyticsMetric[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics`);
  // return res.json();
  return MOCK_METRICS;
}
