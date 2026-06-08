import { PageHeader } from "@/components/dashboard/page-header";

export function CuratorOverview() {
  return (
    <>
      <PageHeader title="Overview" icon="overview" />
      <div className="px-8 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Active exhibitions", value: 3 },
            { label: "Artifacts on display", value: 54 },
            { label: "Pending reviews", value: 7 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/25 px-6 py-5">
              <p className="text-sm text-white/70">{stat.label}</p>
              <p className="mt-2 text-3xl font-light tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
