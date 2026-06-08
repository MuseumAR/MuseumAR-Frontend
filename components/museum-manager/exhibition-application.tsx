import { PageHeader } from "@/components/dashboard/page-header";
import type { ExhibitionApplication } from "@/types";
import Link from "next/link";

export function ExhibitionApplicationTable({
  applications,
}: {
  applications: ExhibitionApplication[];
}) {
  return (
    <>
      <PageHeader title="Exhibition Application" icon="exhibition_application" />
      <div className="space-y-4 px-8 py-8">
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex gap-6 rounded-2xl border border-white/25 p-5 transition-colors hover:border-white/35"
          >
            {/* Image */}
            <div className="h-36 w-48 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
              {app.image ? (
                <img src={app.image} alt={app.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/30 px-3 py-0.5 text-xs text-white/70 transition-colors hover:border-white/50"
                    >
                      {app.status === "Approved" ? "Unpublish" : "Publish"}
                    </button>
                    <StatusBadge status={app.status} />
                  </div>
                </div>

                <dl className="mt-2 space-y-1 text-sm">
                  <Row label="Name" value={app.title} />
                  <Row label="Exhibition Type" value={app.exhibitionType} />
                  <Row
                    label="Date start"
                    value={`${app.dateStart} - Date end: ${app.dateEnd}`}
                  />
                  <Row
                    label="Opening hours"
                    value={`${app.openingHours} - Closing hours: ${app.closingHours}`}
                  />
                  <Row label="Contact Email" value={app.contactEmail} />
                </dl>
              </div>

              <div className="mt-4 flex justify-end">
                <Link
                  href={`/museum-manager/exhibition-application/${app.id}`}
                  className="rounded-lg border border-white/30 px-5 py-1.5 text-xs text-white/70 transition-colors hover:border-white/50 hover:text-white"
                >
                  VIEW DETAIL
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-sm">
      <dt className="text-white/50">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ExhibitionApplication["status"] }) {
  const styles = {
    Approved: "border-emerald-500/50 text-emerald-400",
    Rejected: "border-red-500/50 text-red-400",
    Pending: "border-amber-500/50 text-amber-400",
  };
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
