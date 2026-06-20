import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { EXHIBITION_APPLICATION_LABELS } from "@/lib/field-labels";
import type { ExhibitionApplication } from "@/types";
import Link from "next/link";

export function ExhibitionApplicationTable({ applications }: { applications: ExhibitionApplication[] }) {
  return (
    <div className="px-8 pb-10">
      <PageDescription>
        Submitted exhibitions awaiting review
      </PageDescription>
      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="flex gap-6 rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="h-36 w-48 shrink-0 overflow-hidden rounded-2xl" style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}>
              {app.image ? (
                <img src={app.image} alt={app.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ color: T.mutedLight }}>No image</div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.primaryDark }}>{app.title}</h3>
                  <StatusBadge status={app.status} />
                </div>

                <dl className="mt-2 space-y-1 text-sm" style={{ color: T.muted }}>
                  <Row label={EXHIBITION_APPLICATION_LABELS.exhibitionType!} value={app.exhibitionType} />
                  <Row label={EXHIBITION_APPLICATION_LABELS.dateStart!} value={`${app.dateStart} - ${EXHIBITION_APPLICATION_LABELS.dateEnd}: ${app.dateEnd}`} />
                  <Row label={EXHIBITION_APPLICATION_LABELS.openingHours!} value={`${app.openingHours} - ${EXHIBITION_APPLICATION_LABELS.closingHours}: ${app.closingHours}`} />
                  <Row label={EXHIBITION_APPLICATION_LABELS.contactEmail!} value={app.contactEmail} />
                </dl>
              </div>

              <div className="mt-4 flex justify-end">
                <Link href={`/museum-manager/exhibition-application/${app.id}`} className="rounded-xl px-4 py-1.5 text-xs font-medium" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
                  View Detail
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-sm">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: T.text }}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ExhibitionApplication["status"] }) {
  const styles = {
    Approved: { border: "rgba(79,125,74,0.30)", bg: "rgba(79,125,74,0.10)", color: T.success },
    Rejected: { border: "rgba(180,83,9,0.30)", bg: "rgba(180,83,9,0.10)", color: T.danger },
    Pending: { border: "rgba(200,155,69,0.30)", bg: "rgba(200,155,69,0.12)", color: T.primaryDark },
  };
  const s = styles[status];
  return <span className="rounded-full border px-3 py-0.5 text-xs" style={{ borderColor: s.border, background: s.bg, color: s.color }}>{status}</span>;
}
