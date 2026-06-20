import { MUSEUM_LABELS } from "@/lib/field-labels";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import type { Museum } from "@/types";

export function MuseumManagementTable({ museums }: { museums: Museum[] }) {
  return (
    <div className="px-8 pb-10">
      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_LABELS.id}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_LABELS.name}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_LABELS.location}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_LABELS.manager}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{MUSEUM_LABELS.status}</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {museums.map((museum) => (
              <tr key={museum.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>{museum.id}</td>
                <td className="px-5 py-4" style={{ color: T.text }}>{museum.name}</td>
                <td className="px-5 py-4" style={{ color: T.muted }}>{museum.location}</td>
                <td className="px-5 py-4" style={{ color: T.text }}>{museum.manager}</td>
                <td className="px-5 py-4">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: museum.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(180,83,9,0.12)",
                      color: museum.status === "Active" ? T.success : T.danger,
                    }}
                  >
                    {museum.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    className="rounded-lg px-3 py-1 text-xs font-medium"
                    style={{ background: "rgba(200,155,69,0.15)", color: T.primaryDark }}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
