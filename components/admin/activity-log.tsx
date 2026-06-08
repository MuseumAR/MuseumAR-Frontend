import { PageHeader } from "@/components/dashboard/page-header";
import type { ActivityLog } from "@/types";

export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  return (
    <>
      <PageHeader title="Activity Log" icon="activity_log" />
      <div className="px-8 py-8">
        <div className="overflow-hidden rounded-2xl border border-white/25">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-white/60">
                <th className="px-5 py-4 font-normal">#</th>
                <th className="px-5 py-4 font-normal">User</th>
                <th className="px-5 py-4 font-normal">Action</th>
                <th className="px-5 py-4 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-4 tabular-nums text-white/50">{log.id}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{log.user}</td>
                  <td className="px-5 py-4 text-white/80">{log.action}</td>
                  <td className="px-5 py-4 tabular-nums text-white/60 whitespace-nowrap">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
