"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { ARTIFACT_LABELS } from "@/lib/field-labels";
import { getDisplayError } from "@/lib/validation";
import type { ActiveInactive, Artifact } from "@/types";
import type { ExhibitArassetDto } from "@/types/api";
import { deleteExhibit } from "@/services/content-manager/exhibit.service";
import { getArAssets } from "@/services/content-manager/content-api.service";

interface Props {
  artifact: Artifact;
  backPath: string;
  variant?: "museum-manager" | "content-manager";
}

export function ArtifactDetail({ artifact, backPath, variant = "museum-manager" }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arAssets, setArAssets] = useState<ExhibitArassetDto[]>([]);

  const exhibitId =
    artifact.exhibitId ?? Number(artifact.id.replace(/^EX-/i, ""));

  useEffect(() => {
    if (exhibitId && !Number.isNaN(exhibitId) && exhibitId > 0) {
      getArAssets(exhibitId)
        .then((assets: ExhibitArassetDto[]) => setArAssets(assets || []))
        .catch(() => setArAssets([]));
    }
  }, [exhibitId]);

  async function handleDelete() {
    if (!exhibitId || Number.isNaN(exhibitId)) {
      setError("Unable to find this artifact.");
      return;
    }
    if (!confirm("Delete this artifact?")) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteExhibit(exhibitId);
      router.push(backPath);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to delete artifact."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="px-8 pb-10">
      <Link
        href={backPath}
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        <span>←</span> Back to list
      </Link>

      <div
        className="rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex gap-8">
          {artifact.image && (
            <img
              src={artifact.image}
              alt={artifact.name}
              className="h-48 w-48 rounded-2xl object-cover shrink-0"
              style={{ border: `1px solid ${T.border}` }}
            />
          )}

          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: cinzel, color: T.primaryDark }}>
                  {artifact.name}
                </h2>
                <p className="text-xs font-mono mt-1" style={{ color: T.mutedLight }}>
                  Code: {artifact.id} {exhibitId ? `(DB ID: #${exhibitId})` : ""}
                </p>
              </div>
              <StatusBadge status={artifact.status} />
            </div>

            <dl className="space-y-2 text-sm">
              <InfoRow label={ARTIFACT_LABELS.category!} value={artifact.category} />
              <InfoRow label={ARTIFACT_LABELS.era!} value={artifact.era} />
              <InfoRow label={ARTIFACT_LABELS.location!} value={artifact.location} />
              <ActiveRow label={ARTIFACT_LABELS.qrLinked!} value={artifact.qrLinked} />
              <ActiveRow label={ARTIFACT_LABELS.arModelStatus!} value={artifact.arModelStatus} />
              <ActiveRow label={ARTIFACT_LABELS.audio!} value={artifact.audio} />
            </dl>

            <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>
              <span style={{ color: T.mutedLight }}>{ARTIFACT_LABELS.description}: </span>
              {artifact.description}
            </p>

            {artifact.audioUrl && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(200,155,69,0.04)", border: `1px solid ${T.border}` }}>
                <p className="mb-2 text-sm font-semibold flex items-center gap-2" style={{ color: T.primaryDark }}>
                  <span>🔊</span> Audio Guide Preview
                </p>
                <audio controls src={artifact.audioUrl} className="w-full max-w-md" />
              </div>
            )}

            {(arAssets.length > 0 || artifact.arOverlayUrl || artifact.arMarkerUrl) && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(79,125,74,0.04)", border: `1px solid ${T.border}` }}>
                <p className="mb-3 text-sm font-semibold flex items-center gap-2" style={{ color: T.success }}>
                  <span>🕶️</span> AR Assets Details ({arAssets.length > 0 ? arAssets.length : (artifact.arOverlayUrl ? 1 : 0)})
                </p>
                <div className="flex flex-wrap gap-4 text-xs">
                  {arAssets.length > 0 ? (
                    arAssets.map((asset) => {
                      const url = asset.assetUrl || "";
                      const typeName = asset.assetType || "Asset";
                      return (
                        <div key={asset.id} className="flex flex-col gap-1.5 rounded-xl p-3 border min-w-[140px]" style={{ background: T.bg, borderColor: T.border }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-emerald-800 uppercase text-[10px] bg-emerald-100/60 px-2 py-0.5 rounded">{typeName}</span>
                            <span className="text-[10px]" style={{ color: T.mutedLight }}>#{asset.id}</span>
                          </div>
                          {url.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                            <a href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border my-0.5">
                              <img src={url} alt={typeName} className="h-full w-full object-cover" />
                            </a>
                          ) : (
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline my-1.5">
                              📎 Download File ({typeName})
                            </a>
                          )}
                          {asset.description && (
                            <p className="text-[10px] max-w-[160px] truncate" style={{ color: T.muted }}>{asset.description}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <>
                      {artifact.arOverlayUrl && (
                        <div className="flex flex-col gap-1.5 rounded-xl p-3 border" style={{ background: T.bg, borderColor: T.border }}>
                          <span className="font-semibold" style={{ color: T.muted }}>Overlay Model/Image</span>
                          {artifact.arOverlayUrl.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                            <a href={artifact.arOverlayUrl} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border">
                              <img src={artifact.arOverlayUrl} alt="AR Overlay Preview" className="h-full w-full object-cover" />
                            </a>
                          ) : (
                            <a href={artifact.arOverlayUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                              📎 Download 3D Model (.glb)
                            </a>
                          )}
                        </div>
                      )}
                      {artifact.arMarkerUrl && (
                        <div className="flex flex-col gap-1.5 rounded-xl p-3 border" style={{ background: T.bg, borderColor: T.border }}>
                          <span className="font-semibold" style={{ color: T.muted }}>Marker Target Image</span>
                          <a href={artifact.arMarkerUrl} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border">
                            <img src={artifact.arMarkerUrl} alt="AR Marker Target" className="h-full w-full object-cover" />
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* QR Code Section */}
            {artifact.qrCodeData && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(200,155,69,0.06)", border: `1px solid ${T.border}` }}>
                <p className="mb-3 text-sm font-semibold flex items-center gap-2" style={{ color: T.primaryDark }}>
                  <span>📷</span> Mã QR Code Hiện vật (Dành cho Khách quét)
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
                  {artifact.qrCodeImageUrl && (
                    <a href={artifact.qrCodeImageUrl} target="_blank" rel="noreferrer" className="block h-28 w-28 shrink-0 overflow-hidden rounded-xl border p-1" style={{ background: "#FFFFFF", borderColor: T.border }}>
                      <img src={artifact.qrCodeImageUrl} alt="Artifact QR Code" className="h-full w-full object-contain" />
                    </a>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-xs font-mono font-semibold" style={{ color: T.text }}>
                      Mã dữ liệu QR: <span className="bg-amber-100/60 px-2 py-0.5 rounded text-amber-900">{artifact.qrCodeData}</span>
                    </p>
                    <p className="text-xs" style={{ color: T.muted }}>
                      Khách hàng sử dụng ứng dụng di động để quét mã này để nghe thuyết minh & xem AR 3D.
                    </p>
                    {artifact.qrCodeImageUrl && (
                      <a
                        href={artifact.qrCodeImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold hover:underline text-amber-800"
                      >
                        ⬇ Mở / Tải ảnh QR Code (300x300)
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p
            className="mt-4 rounded-xl px-3 py-2 text-sm"
            style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
          >
            {error}
          </p>
        )}

        {variant === "content-manager" && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-xl border px-5 py-1.5 text-sm disabled:opacity-50"
              style={{ borderColor: "rgba(180,83,9,0.35)", color: T.danger }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
            <Link
              href={`/content-manager/artifact/${artifact.id}/edit`}
              className="rounded-xl border px-5 py-1.5 text-sm"
              style={{ borderColor: "rgba(79,125,74,0.35)", color: T.success }}
            >
              Update
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: T.text }}>{value}</dd>
    </div>
  );
}

function ActiveRow({ label, value }: { label: string; value: ActiveInactive }) {
  return (
    <div className="flex gap-2">
      <dt style={{ color: T.mutedLight }}>{label}:</dt>
      <dd style={{ color: value === "Active" ? T.success : T.primaryDark }}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: { border: "rgba(79,125,74,0.30)", bg: "rgba(79,125,74,0.10)", color: T.success },
    Draft: { border: "rgba(109,90,69,0.26)", bg: "rgba(109,90,69,0.10)", color: T.muted },
    Pending: { border: "rgba(200,155,69,0.30)", bg: "rgba(200,155,69,0.12)", color: T.primaryDark },
  };
  const s = styles[status];
  return (
    <span
      className="rounded-full border px-3 py-0.5 text-xs"
      style={{ borderColor: s.border, background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}
