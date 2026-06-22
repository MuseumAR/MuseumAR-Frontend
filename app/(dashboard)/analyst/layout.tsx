export const dynamic = "force-dynamic";

import { RoleLayout } from "@/components/dashboard/role-layout";

export default function AnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="analyst">{children}</RoleLayout>;
}
