"use client";

import { AppStatusPage } from "@/components/shared/app-status-page";

export default function DashboardErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppStatusPage
      title="Something went wrong"
      description="The dashboard could not load this page. Try again, or go back home."
      primaryLabel="Try again"
      primaryAsButton
      onPrimary={reset}
      secondaryHref="/"
      secondaryLabel="Home"
    />
  );
}
