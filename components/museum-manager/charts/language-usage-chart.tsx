import type { LanguageUsage } from "@/types";

export function LanguageUsageChart({ data }: { data: LanguageUsage[] }) {
  const gradient = data
    .map((item, index) => {
      const start = data.slice(0, index).reduce((sum, i) => sum + i.percent, 0);
      return `${item.color} ${start}% ${start + item.percent}%`;
    })
    .join(", ");

  return (
    <div className="rounded-2xl border border-white/25 p-6">
      <h2 className="text-lg font-medium">Language Usage</h2>
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div
          className="relative h-40 w-40 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-6 rounded-full bg-black" />
        </div>
        <ul className="space-y-3 text-sm">
          {data.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
              <span className="text-white/60">{item.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
