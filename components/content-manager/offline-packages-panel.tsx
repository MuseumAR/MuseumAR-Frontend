"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Download, FileArchive, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import { getApiUrl } from "@/services/api-client";
import { generatePackageEntry } from "@/services/content-manager/offline-package.service";
import type { OfflinePackageDto } from "@/types/api";

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function getPackageDownloadUrl(packageUrl?: string | null) {
  if (!packageUrl) return "#";
  if (packageUrl.startsWith("http://") || packageUrl.startsWith("https://")) {
    return packageUrl;
  }
  const cleanPath = packageUrl.startsWith("/") ? packageUrl : `/${packageUrl}`;
  try {
    return getApiUrl(cleanPath);
  } catch {
    return "#";
  }
}

export function OfflinePackagesPanel({
  packages,
}: {
  packages: OfflinePackageDto[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [versionId, setVersionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vid = Number(versionId);
    if (!versionId.trim() || Number.isNaN(vid)) {
      setError("Please enter a valid content version ID.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await generatePackageEntry({ versionId: vid });
      setShowForm(false);
      setVersionId("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not create offline package."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: cinzel, color: T.text }}>
            Offline Packages ({packages.length})
          </h2>
          <p className="text-xs mt-0.5" style={{ color: T.mutedLight }}>
            Manage and download compressed data packages (.zip) for offline access on mobile
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          + Create offline package
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-md rounded-3xl p-6 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: T.primaryDark }}>Create new offline ZIP package</h3>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: T.muted }}>Content version ID *</label>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 1, 2, 3..."
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>
          {error && <p className="mt-3 text-xs" style={{ color: "#8B2E2E" }}>{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              {isSubmitting ? "Packaging ZIP…" : "Start creating"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl shadow-sm" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {packages.length === 0 ? (
          <div className="px-8 py-16 text-center text-sm font-medium" style={{ color: T.muted }}>
            No offline packages yet. Use the button above to create a new ZIP data package.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                  {["Package ID", "Version", "Status", "Size", "Images / Audio / 3D", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: T.mutedLight }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => {
                  const isAvailable = pkg.status === "Available";
                  const downloadUrl = getPackageDownloadUrl(pkg.packageUrl);

                  return (
                    <tr key={pkg.id} className="transition-colors hover:bg-[rgba(200,155,69,0.05)]" style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td className="px-5 py-4 font-mono font-bold" style={{ color: T.text }}>
                        #{pkg.id}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: T.muted }}>
                        v{pkg.versionId}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: isAvailable
                              ? "rgba(79,125,74,0.12)"
                              : pkg.status === "Building"
                              ? "rgba(200,155,69,0.15)"
                              : "rgba(180,40,40,0.12)",
                            color: isAvailable
                              ? T.success
                              : pkg.status === "Building"
                              ? T.primaryDark
                              : T.danger,
                          }}
                        >
                          {isAvailable ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : pkg.status === "Building" ? (
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {labelStatus(pkg.status) || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-medium" style={{ color: T.text }}>
                        {formatBytes(pkg.packageSizeBytes)}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: T.muted }}>
                        <div className="flex flex-col gap-0.5">
                          <span>📷 Images: {pkg.imageCount ?? 0}</span>
                          <span>🔊 Audio: {pkg.audioCount ?? 0}</span>
                          <span>🧊 3D AR: {pkg.arassetCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: T.muted }}>
                        {pkg.createdAt?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {isAvailable && pkg.packageUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-transform active:scale-95 hover:opacity-90"
                            style={{
                              background: T.primary,
                              color: T.surface,
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download ZIP
                          </a>
                        ) : (
                          <span className="text-xs italic" style={{ color: T.mutedLight }}>
                            {pkg.status === "Building" ? "Processing…" : "Not available"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
