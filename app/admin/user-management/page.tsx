import { UserManagementTable } from "@/components/admin/user-management-table";
import { getUsers } from "@/services/user.service";

export default async function UserManagementPage() {
  const users = await getUsers();
  return <UserManagementTable initialUsers={users} />;
}
