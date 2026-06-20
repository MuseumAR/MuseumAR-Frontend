import { MUSEUM_APPLICATION_LABELS } from "@/lib/field-labels";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import type { MuseumApplication } from "@/types";

export function MuseumApplicationTable({ applications }: { applications: MuseumApplication[] }) {
  return (
    <div className="px-8 pb-10">
      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_APPLICATION_LABELS.id}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_APPLICATION_LABELS.museum}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_APPLICATION_LABELS.submitted}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_APPLICATION_LABELS.status}</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                <td className="px-5 py-4" style={{ color: T.text }}>{app.id}</td>
                <td className="px-5 py-4" style={{ color: T.text }}>{app.museum}</td>
                <td className="px-5 py-4" style={{ color: T.muted }}>{app.submitted}</td>
                <td className="px-5 py-4">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background:
                        app.status === "Approved"
                          ? "rgba(79,125,74,0.12)"
                          : app.status === "Rejected"
                            ? "rgba(180,83,9,0.12)"
                            : "rgba(200,155,69,0.15)",
                      color:
                        app.status === "Approved"
                          ? T.success
                          : app.status === "Rejected"
                            ? T.danger
                            : T.primaryDark,
                    }}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {app.status === "Pending" && (
                    <div className="flex gap-2">
                      <button type="button" className="rounded-lg px-3 py-1 text-xs text-white" style={{ background: T.success }}>Approve</button>
                      <button type="button" className="rounded-lg px-3 py-1 text-xs text-white" style={{ background: T.danger }}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
