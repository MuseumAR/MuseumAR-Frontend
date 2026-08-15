import { AppStatusPage } from "@/components/shared/app-status-page";

export default function DashboardNotFound() {
  return (
    <AppStatusPage
      title="Page not found"
      description="This record or route does not exist, or it was removed."
      primaryHref="/"
      primaryLabel="Home"
    />
  );
}
