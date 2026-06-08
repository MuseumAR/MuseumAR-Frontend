import type { PopularExhibit } from "@/types";
import { formatNumber } from "@/lib/format";

export function PopularExhibitChart({ data }: { data: PopularExhibit[] }) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="rounded-2xl border border-white/25 p-6">
      <h2 className="text-lg font-medium">Popular Exhibit</h2>
      <div className="mt-6 space-y-5">
        {data.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between text-sm">
              <span>{item.name}</span>
              <span className="tabular-nums text-white/70">{formatNumber(item.value)}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
