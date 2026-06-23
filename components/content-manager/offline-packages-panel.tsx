"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { generatePackageEntry } from "@/services/content-manager/offline-package.service";
import type { OfflinePackageDto } from "@/types/api";

export function OfflinePackagesPanel({
  packages,
  museumId,
}: {
  packages: OfflinePackageDto[];
  museumId: number;
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
      setError("Enter a valid content version ID.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await generatePackageEntry({ museumId, versionId: vid });
      setShowForm(false);
      setVersionId("");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to generate package."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            {packages.length} package{packages.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          Generate package
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-md rounded-3xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <label className="block text-sm" style={{ color: T.muted }}>Content version ID *</label>
          <input
            type="number"
            min="1"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
            className="mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
          {error && <p className="mt-3 text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              {isSubmitting ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {packages.length === 0 ? (
          <p className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>No offline packages yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(245,230,200,0.35)" }}>
                {["ID", "Version ID", "Status", "AR assets", "Created"].map((h) => (
                  <th key={h} className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td className="px-5 py-4" style={{ color: T.text }}>{pkg.id}</td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>{pkg.versionId}</td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>{pkg.status ?? "—"}</td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>{pkg.arassetCount ?? "—"}</td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>{pkg.createdAt?.slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
