import type { VisitorTrend } from "@/types";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const CHART_HEIGHT = 280;
const CHART_WIDTH = 520;
const PADDING = { top: 20, right: 20, bottom: 40, left: 48 };

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return value.toString();
}

export function VisitorsTrendChart({ data }: { data: VisitorTrend[] }) {
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Calculate dynamic Y_MAX and Y_TICKS based on data values
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const Y_MAX = maxVal <= 5 ? 5 : maxVal <= 10 ? 10 : maxVal <= 50 ? 50 : maxVal <= 100 ? 100 : Math.ceil(maxVal / 100) * 100;
  const Y_TICKS = Array.from({ length: 5 }, (_, i) => Math.round((Y_MAX / 5) * (i + 1)));

  const points = data.map((item, index) => ({
    ...item,
    x: PADDING.left + (index / (data.length - 1)) * innerWidth,
    y: PADDING.top + innerHeight - (item.value / Y_MAX) * innerHeight,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div
      className="flex h-full min-h-[360px] flex-col rounded-3xl p-6"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
      }}
    >
      <h2 className="text-base font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        Xu hướng khách tham quan
      </h2>
      <div className="mt-4 flex flex-1 items-center justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-full w-full max-w-full"
          role="img"
          aria-label="Biểu đồ xu hướng khách tham quan"
        >
          {Y_TICKS.map((tick) => {
            const y = PADDING.top + innerHeight - (tick / Y_MAX) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={CHART_WIDTH - PADDING.right}
                  y2={y}
                  stroke={T.border}
                />
                <text
                  x={PADDING.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={T.mutedLight}
                  fontSize="11"
                >
                  {formatCompactNumber(tick)}
                </text>
              </g>
            );
          })}

          <path
            d={linePath}
            fill="none"
            stroke={T.primaryDark}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="4" fill={T.primary} />
              <text
                x={point.x}
                y={CHART_HEIGHT - 12}
                textAnchor="middle"
                fill={T.mutedLight}
                fontSize="10"
              >
                {point.day.length > 8 ? point.day.substring(0, 8) + ".." : point.day}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
