import { ActivityLogTable } from "@/components/admin/activity-log";
import { getActivityLogs } from "@/services/activity-log.service";

export default async function ActivityLogPage() {
  const logs = await getActivityLogs();
  return <ActivityLogTable logs={logs} />;
}
