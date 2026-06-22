export const dynamic = "force-dynamic";

import { RoleLayout } from "@/components/dashboard/role-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="admin">{children}</RoleLayout>;
}
