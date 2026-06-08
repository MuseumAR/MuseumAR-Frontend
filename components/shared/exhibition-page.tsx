import { PageHeader } from "@/components/dashboard/page-header";
import { formatNumber } from "@/lib/format";
import type { Exhibition } from "@/types";

interface Props {
  exhibitions: Exhibition[];
}

export function ExhibitionPageContent({ exhibitions }: Props) {
  return (
    <>
      <PageHeader title="Exhibition" icon="exhibition" />
      <div className="grid gap-4 px-8 py-8 md:grid-cols-2 xl:grid-cols-3">
        {exhibitions.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/25 p-6 transition-colors hover:border-white/40"
          >
            <p className="text-xs text-white/50">Exhibition #{item.id}</p>
            <h2 className="mt-2 text-lg font-medium">{item.name}</h2>
            <dl className="mt-4 space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <dt>Artifacts</dt>
                <dd className="text-white">{item.artifacts}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Visitors</dt>
                <dd className="text-white">{formatNumber(item.visitors)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className="text-white">{item.status}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
