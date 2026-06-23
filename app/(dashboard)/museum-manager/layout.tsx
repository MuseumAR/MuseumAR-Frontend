export const dynamic = "force-dynamic";

import { RoleLayout } from "@/components/dashboard/role-layout";

export default function MuseumManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="MuseumManager">{children}</RoleLayout>;
}
