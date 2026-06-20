import { ACTIVITY_LOG_LABELS } from "@/lib/field-labels";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import type { ActivityLog } from "@/types";

export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="px-8 pb-10">
      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{ACTIVITY_LOG_LABELS.id}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{ACTIVITY_LOG_LABELS.user}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{ACTIVITY_LOG_LABELS.action}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{ACTIVITY_LOG_LABELS.time}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                <td className="px-5 py-4 tabular-nums" style={{ color: T.mutedLight }}>{log.id}</td>
                <td className="px-5 py-4 whitespace-nowrap" style={{ color: T.text }}>{log.user}</td>
                <td className="px-5 py-4" style={{ color: T.muted }}>{log.action}</td>
                <td className="px-5 py-4 tabular-nums whitespace-nowrap" style={{ color: T.mutedLight }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
