import type { VisitorTrend } from "@/types";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const CHART_HEIGHT = 280;
const CHART_WIDTH = 520;
const PADDING = { top: 20, right: 20, bottom: 40, left: 48 };
const Y_MAX = 600;
const Y_TICKS = [100, 200, 300, 400, 500, 600];

export function VisitorsTrendChart({ data }: { data: VisitorTrend[] }) {
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

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
        Visitors Trend
      </h2>
      <div className="mt-4 flex flex-1 items-center justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-full w-full max-w-full"
          role="img"
          aria-label="Visitors trend chart"
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
                  {tick}
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
                fontSize="12"
              >
                {point.day}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
