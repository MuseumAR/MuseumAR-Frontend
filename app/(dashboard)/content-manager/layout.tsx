export const dynamic = "force-dynamic";

import { RoleLayout } from "@/components/dashboard/role-layout";

export default function ContentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="ContentManager">{children}</RoleLayout>;
}
