import { StaffManagementTable } from "@/components/museum-manager/staff-management";
import { getStaff } from "@/services/staff.service";

export default async function StaffManagementPage() {
  const staff = await getStaff();
  return <StaffManagementTable staff={staff} />;
}
