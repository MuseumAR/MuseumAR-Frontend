import { PageDescription } from "@/components/dashboard/page-header";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { ARTIFACT_LABELS } from "@/lib/field-labels";
import type { ActiveInactive, Artifact } from "@/types";
import Link from "next/link";

interface Props {
  artifact: Artifact;
  backPath: string;
  variant?: "museum-manager" | "content-manager";
}

export function ArtifactDetail({ artifact, backPath, variant = "museum-manager" }: Props) {
  return (
    <div className="px-8 pb-10">
      <PageDescription>
        Artifact metadata and publishing status
      </PageDescription>
      <Link href={backPath} className="mb-6 inline-flex items-center gap-2 text-sm" style={{ color: T.muted }}><span>?</span> Back to list</Link>

      <div className="rounded-3xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex gap-8">
          <div className="h-64 w-56 shrink-0 overflow-hidden rounded-2xl" style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}>
            {artifact.image ? <img src={artifact.image} alt={artifact.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center" style={{ color: T.mutedLight }}>No image</div>}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold" style={{ fontFamily: cinzel, color: T.primaryDark }}>{artifact.name}</h2>
              <StatusBadge status={artifact.status} />
            </div>

            <p className="text-sm" style={{ color: T.muted }}>ID: {artifact.id}</p>

            <dl className="space-y-2 text-sm">
              <InfoRow label={ARTIFACT_LABELS.category!} value={artifact.category} />
              <InfoRow label={ARTIFACT_LABELS.era!} value={artifact.era} />
              <InfoRow label={ARTIFACT_LABELS.location!} value={artifact.location} />
              <ActiveRow label={ARTIFACT_LABELS.qrLinked!} value={artifact.qrLinked} />
              <ActiveRow label={ARTIFACT_LABELS.arModelStatus!} value={artifact.arModelStatus} />
            </dl>

            <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>
              <span style={{ color: T.mutedLight }}>{ARTIFACT_LABELS.description}: </span>
              {artifact.description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {variant === "content-manager" ? (
            <>
              <button type="button" className="rounded-xl border px-5 py-1.5 text-sm" style={{ borderColor: "rgba(180,83,9,0.35)", color: T.danger }}>Delete</button>
              <Link href={`/content-manager/artifact/${artifact.id}/edit`} className="rounded-xl border px-5 py-1.5 text-sm" style={{ borderColor: "rgba(79,125,74,0.35)", color: T.success }}>Update</Link>
            </>
          ) : (
            <>
              <button type="button" className="rounded-xl border px-5 py-1.5 text-sm" style={{ borderColor: "rgba(180,83,9,0.35)", color: T.danger }}>Reject</button>
              <button type="button" className="rounded-xl border px-5 py-1.5 text-sm" style={{ borderColor: "rgba(79,125,74,0.35)", color: T.success }}>Approve</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-2"><dt style={{ color: T.mutedLight }}>{label}:</dt><dd style={{ color: T.text }}>{value}</dd></div>;
}

function ActiveRow({ label, value }: { label: string; value: ActiveInactive }) {
  return <div className="flex gap-2"><dt style={{ color: T.mutedLight }}>{label}:</dt><dd className={value === "Active" ? "text-emerald-700" : "text-orange-700"}>{value}</dd></div>;
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: { border: "rgba(79,125,74,0.30)", bg: "rgba(79,125,74,0.10)", color: T.success },
    Draft: { border: "rgba(109,90,69,0.26)", bg: "rgba(109,90,69,0.10)", color: T.muted },
    Pending: { border: "rgba(200,155,69,0.30)", bg: "rgba(200,155,69,0.12)", color: T.primaryDark },
  };
  const s = styles[status];
  return <span className="rounded-full border px-3 py-0.5 text-xs" style={{ borderColor: s.border, background: s.bg, color: s.color }}>{status}</span>;
}
