import { dashboardTheme as T } from "@/lib/dashboard-theme";

export function PageDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 text-sm" style={{ color: T.muted }}>
      {children}
    </p>
  );
}
