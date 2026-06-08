import { RoleLayout } from "@/components/dashboard/role-layout";

export default function MuseumManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="museum_manager">{children}</RoleLayout>;
}
