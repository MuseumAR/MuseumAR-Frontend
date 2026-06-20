import type { PopularExhibit } from "@/types";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export function PopularExhibitChart({ data }: { data: PopularExhibit[] }) {
  const maxValue = Math.max(...data.map((item) => item.value));

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
        Popular Exhibits
      </h2>
      <div className="mt-6 space-y-5">
        {data.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: T.text }}>{item.name}</span>
              <span className="tabular-nums" style={{ color: T.muted }}>
                {formatNumber(item.value)}
              </span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full"
              style={{ background: "rgba(200,155,69,0.12)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  background: `linear-gradient(90deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
