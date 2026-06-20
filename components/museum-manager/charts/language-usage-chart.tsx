import type { LanguageUsage } from "@/types";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const CHART_COLORS = ["#C89B45", "#9A6F1F", "#5C4033", "#A08060"];

export function LanguageUsageChart({ data }: { data: LanguageUsage[] }) {
  const gradient = data
    .map((item, index) => {
      const start = data.slice(0, index).reduce((sum, i) => sum + i.percent, 0);
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return `${color} ${start}% ${start + item.percent}%`;
    })
    .join(", ");

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
      }}
    >
      <h2 className="text-base font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        Language Usage
      </h2>
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div
          className="relative h-40 w-40 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div
            className="absolute inset-6 rounded-full"
            style={{ background: T.surface }}
          />
        </div>
        <ul className="space-y-3 text-sm">
          {data.map((item, index) => (
            <li key={item.name} className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span style={{ color: T.text }}>{item.name}</span>
              <span style={{ color: T.muted }}>{item.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
