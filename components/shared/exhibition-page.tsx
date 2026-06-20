import { PageDescription } from "@/components/dashboard/page-header";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { Exhibition } from "@/types";

interface Props {
  exhibitions: Exhibition[];
}

export function ExhibitionPageContent({ exhibitions }: Props) {
  return (
    <>
      <div className="px-8 pb-10">
        <PageDescription>
          Current and upcoming museum exhibitions
        </PageDescription>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exhibitions.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl p-6 transition-colors"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
            }}
          >
            <p className="text-xs" style={{ color: T.mutedLight }}>
              Exhibition #{item.id}
            </p>
            <h2
              className="mt-2 text-lg font-semibold"
              style={{ fontFamily: cinzel, color: T.text }}
            >
              {item.name}
            </h2>
            <dl className="mt-4 space-y-2 text-sm" style={{ color: T.muted }}>
              <div className="flex justify-between">
                <dt>Artifacts</dt>
                <dd style={{ color: T.text }}>{item.artifacts}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Visitors</dt>
                <dd style={{ color: T.text }}>{formatNumber(item.visitors)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background:
                      item.status === "Active"
                        ? "rgba(79,125,74,0.12)"
                        : item.status === "Upcoming"
                          ? "rgba(200,155,69,0.15)"
                          : "rgba(109,90,69,0.12)",
                    color:
                      item.status === "Active"
                        ? T.success
                        : item.status === "Upcoming"
                          ? T.primaryDark
                          : T.muted,
                  }}
                >
                  {item.status}
                </dd>
              </div>
            </dl>
          </article>
        ))}
        </div>
      </div>
    </>
  );
}
