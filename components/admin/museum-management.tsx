import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { MuseumDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active ? "rgba(79,125,74,0.12)" : "rgba(180,83,9,0.12)",
        color: active ? T.success : T.danger,
      }}
    >
      {status}
    </span>
  );
}

export function MuseumManagementPanel({ museums }: { museums: MuseumDto[] }) {
  return (
    <div className="space-y-6 px-8 pb-10">
      <div>
        <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          {museums.length} museum{museums.length === 1 ? "" : "s"} registered
        </p>
      </div>

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {museums.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm" style={{ color: T.muted }}>
              No museums registered yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: "rgba(245,230,200,0.35)",
                  }}
                >
                  {["ID", "Name", "City", "Address", "Description", "Status"].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-4 font-medium"
                      style={{ color: T.mutedLight }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {museums.map((museum) => (
                  <tr
                    key={museum.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    className="hover:bg-[rgba(200,155,69,0.05)]"
                  >
                    <td className="px-5 py-4 tabular-nums" style={{ color: T.text }}>
                      {museum.id}
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                      {museum.name}
                    </td>
                    <td className="px-5 py-4" style={{ color: T.muted }}>
                      {museum.city ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-4" style={{ color: T.muted }}>
                      {museum.address ?? "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-5 py-4" style={{ color: T.muted }}>
                      {museum.description ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={museum.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
