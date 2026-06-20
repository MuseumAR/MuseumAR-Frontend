import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { STAFF_LABELS } from "@/lib/field-labels";
import type { StaffMember } from "@/types";

export function StaffManagementTable({ staff }: { staff: StaffMember[] }) {
  return (
    <div className="px-8 pb-10">
      <PageDescription>Museum team directory</PageDescription>
      <div className="overflow-hidden rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{STAFF_LABELS.name}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{STAFF_LABELS.email}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{STAFF_LABELS.roleLabel}</th>
              <th className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{STAFF_LABELS.status}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.email} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[rgba(200,155,69,0.05)]">
                <td className="px-5 py-4" style={{ color: T.text }}>
                  <p className="font-medium" style={{ fontFamily: cinzel }}>{member.name}</p>
                </td>
                <td className="px-5 py-4" style={{ color: T.muted }}>{member.email}</td>
                <td className="px-5 py-4" style={{ color: T.text }}>{member.roleLabel}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{
                    background: member.status === "Active" ? "rgba(79,125,74,0.12)" : "rgba(180,83,9,0.10)",
                    color: member.status === "Active" ? T.success : T.danger,
                  }}>{member.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
