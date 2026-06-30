export const dynamic = "force-dynamic";

import { RoleLayout } from "@/components/dashboard/role-layout";

export default function TicketManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="TicketManager">{children}</RoleLayout>;
}
