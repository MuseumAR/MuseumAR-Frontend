import { RoleLayout } from "@/components/dashboard/role-layout";

export default function ContentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="content_manager">{children}</RoleLayout>;
}
