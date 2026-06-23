import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export function NoMuseumEmptyState({
  title = "No museum registered yet",
  description = "Create your museum profile to start managing exhibitions, analytics, and tickets.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "rgba(200,155,69,0.12)", color: T.primary }}
      >
        <Landmark className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm" style={{ color: T.muted }}>
        {description}
      </p>
      <Link
        href="/museum-manager/museum-profile/create"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        style={{
          background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
          color: T.surface,
        }}
      >
        <Plus className="h-4 w-4" />
        Register museum
      </Link>
    </div>
  );
}
