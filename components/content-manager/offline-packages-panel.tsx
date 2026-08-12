"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Plus,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { generatePackageEntry } from "@/services/content-manager/offline-package.service";
import type { ContentVersionDto, OfflinePackageDto } from "@/types/api";

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";
  const cleanPath = packageUrl.startsWith("/") ? packageUrl : `/${packageUrl}`;
  return `${apiUrl}${cleanPath}`;
}

export function OfflinePackagesPanel({
  packages,
  versions,
  initialVersionId = null,
}: {
  packages: OfflinePackageDto[];
  versions: ContentVersionDto[];
  initialVersionId?: number | null;
}) {
  const router = useRouter();
  const latestId = versions[0]?.id ?? null;
  const defaultId = initialVersionId ?? latestId;

  const [showForm, setShowForm] = useState(Boolean(initialVersionId) || versions.length > 0);
  const [versionId, setVersionId] = useState(
    defaultId != null ? String(defaultId) : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = useMemo(() => {
    const id = Number(versionId);
    const v = versions.find((x) => x.id === id);
    if (!v) return null;
    return `${v.versionNumber} · #${v.id}`;
  }, [versionId, versions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vid = Number(versionId);
    if (!versionId.trim() || Number.isNaN(vid)) {
      setError("Select a Content Version to generate a package.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await generatePackageEntry({ versionId: vid });
      setShowForm(false);
      router.replace("/content-manager/offline-packages");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create offline package."));
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
          <p className="mt-0.5 text-xs" style={{ color: T.mutedLight }}>
            Pick a Content Version → build a ZIP for mobile offline use. Version ID is prefilled
            (latest, or from the Versions page).
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
          {showForm ? "Close form" : "+ New offline package"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="max-w-lg rounded-3xl p-6 shadow-sm"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <h3 className="mb-1 text-sm font-bold" style={{ color: T.primaryDark }}>
            Create offline ZIP package
          </h3>
          <p className="mb-4 text-xs" style={{ color: T.muted }}>
            No need to type an ID — pick a version from the list (latest is selected by default).
          </p>

          {versions.length === 0 ? (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(200,155,69,0.1)", color: T.text }}>
              No Content Version yet.{" "}
              <Link
                href="/content-manager/content-versions"
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: T.primaryDark }}
              >
                Create a version first
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: T.muted }}>
                Content Version *
              </label>
              <div className="relative">
                <Tag
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: T.primaryDark }}
                />
                <select
                  value={versionId}
                  onChange={(e) => setVersionId(e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                >
                  {versions.map((v, idx) => (
                    <option key={v.id} value={v.id}>
                      {idx === 0 ? "★ Latest — " : ""}
                      {v.versionNumber} (ID #{v.id})
                      {v.changeDescription ? ` — ${v.changeDescription.slice(0, 40)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedLabel && (
                <p className="text-[11px]" style={{ color: T.muted }}>
                  Selected: <strong style={{ color: T.text }}>{selectedLabel}</strong>
                  {Number(versionId) === latestId ? " · latest" : ""}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs" style={{ color: "#8B2E2E" }}>
              {error}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || versions.length === 0}
              className="rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50"
              style={{ background: T.primary, color: T.surface }}
            >
              {isSubmitting ? "Building ZIP…" : "Start build"}
            </button>
          </div>
        </form>
      )}

      <div
        className="overflow-hidden rounded-3xl shadow-sm"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {packages.length === 0 ? (
          <div className="px-8 py-16 text-center text-sm font-medium" style={{ color: T.muted }}>
            No offline packages yet. Use the button above to create a new ZIP.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                  {["Package", "Version", "Status", "Size", "Images / Audio / 3D", "Created", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: T.mutedLight }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => {
                  const isAvailable = pkg.status === "Available";
                  const downloadUrl = getPackageDownloadUrl(pkg.packageUrl);

                  return (
                    <tr
                      key={pkg.id}
                      className="transition-colors hover:bg-[rgba(200,155,69,0.05)]"
                      style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                      <td className="px-5 py-4 font-mono font-bold" style={{ color: T.text }}>
                        #{pkg.id}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: T.muted }}>
                        ID #{pkg.versionId}
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
                          {pkg.status || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-medium" style={{ color: T.text }}>
                        {formatBytes(pkg.packageSizeBytes)}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: T.muted }}>
                        <div className="flex flex-col gap-0.5">
                          <span>Images: {pkg.imageCount ?? 0}</span>
                          <span>Audio: {pkg.audioCount ?? 0}</span>
                          <span>3D AR: {pkg.arassetCount ?? 0}</span>
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
                            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:opacity-90 active:scale-95"
                            style={{ background: T.primary, color: T.surface }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download ZIP
                          </a>
                        ) : (
                          <span className="text-xs italic" style={{ color: T.mutedLight }}>
                            {pkg.status === "Building" ? "Processing…" : "Unavailable"}
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
