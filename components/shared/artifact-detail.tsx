import { PageHeader } from "@/components/dashboard/page-header";
import type { Artifact, ActiveInactive } from "@/types";
import Link from "next/link";

interface Props {
  artifact: Artifact;
  backPath: string;
  variant?: "museum-manager" | "content-manager";
}

export function ArtifactDetail({ artifact, backPath, variant = "museum-manager" }: Props) {
  return (
    <>
      <PageHeader title="Artifact Detail" icon="artifact" />
      <div className="px-8 py-8">
        <Link
          href={backPath}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          <span>←</span> Back to list
        </Link>

        <div className="rounded-2xl border border-white/25 p-6">
          <div className="flex gap-8">
            {/* Image */}
            <div className="h-64 w-56 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
              {artifact.image ? (
                <img
                  src={artifact.image}
                  alt={artifact.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex flex-1 flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-amber-400">{artifact.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-white/30 px-3 py-0.5 text-xs text-white/70 transition-colors hover:border-white/50"
                  >
                    {artifact.status === "Published" ? "Unpublish" : "Publish"}
                  </button>
                  <StatusBadge status={artifact.status} />
                </div>
              </div>

              <p className="text-sm text-white/60">ID: {artifact.id}</p>

              <dl className="space-y-2 text-sm">
                <InfoRow label="Category" value={artifact.category} />
                <InfoRow label="Era" value={artifact.era} />
                <InfoRow label="Location" value={artifact.location} />
                <ActiveRow label="QR Linked" value={artifact.qrLinked} />
                <ActiveRow label="AR Model" value={artifact.arModelStatus} />
              </dl>

              <p className="mt-2 text-sm leading-relaxed text-white/70">
                <span className="text-white/50">Description: </span>
                {artifact.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            {variant === "content-manager" ? (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/60 px-5 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete
                </button>
                <Link
                  href={`/content-manager/artifact/${artifact.id}/edit`}
                  className="rounded-lg border border-emerald-500 px-5 py-1.5 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
                >
                  Update
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/60 px-5 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-emerald-500 px-5 py-1.5 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-white/50">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ActiveRow({ label, value }: { label: string; value: ActiveInactive }) {
  return (
    <div className="flex gap-2">
      <dt className="text-white/50">{label}:</dt>
      <dd className={value === "Active" ? "text-emerald-400" : "text-red-400"}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: "border-emerald-500/50 text-emerald-400",
    Draft: "border-white/25 text-white/50",
    Pending: "border-amber-500/50 text-amber-400",
  };
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
