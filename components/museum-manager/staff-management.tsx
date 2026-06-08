import { PageHeader } from "@/components/dashboard/page-header";
import type { StaffMember } from "@/types";

export function StaffManagementTable({ staff }: { staff: StaffMember[] }) {
  return (
    <>
      <PageHeader title="Staff Management" icon="staff" />
      <div className="px-8 py-8">
        <div className="overflow-hidden rounded-2xl border border-white/25">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-white/70">
                <th className="px-5 py-4 font-normal">Name</th>
                <th className="px-5 py-4 font-normal">Email</th>
                <th className="px-5 py-4 font-normal">Role</th>
                <th className="px-5 py-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.email} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-4">{member.name}</td>
                  <td className="px-5 py-4 text-white/70">{member.email}</td>
                  <td className="px-5 py-4">{member.roleLabel}</td>
                  <td className="px-5 py-4">{member.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
