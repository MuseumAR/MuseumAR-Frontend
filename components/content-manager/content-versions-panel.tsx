"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { createVersionEntry } from "@/services/content-manager/content-version.service";
import type { ContentVersionDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const published = status === "Published";
  const draft = status === "Draft";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: published
          ? "rgba(79,125,74,0.12)"
          : draft
            ? "rgba(200,155,69,0.15)"
            : "rgba(109,90,69,0.12)",
        color: published ? T.success : draft ? T.primaryDark : T.muted,
      }}
    >
      {status}
    </span>
  );
}

export function ContentVersionsPanel({
  versions,
  museumId,
}: {
  versions: ContentVersionDto[];
  museumId: number;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [versionNumber, setVersionNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!versionNumber.trim()) {
      setError("Version number is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createVersionEntry(versionNumber.trim(), description.trim(), museumId);
      setVersionNumber("");
      setDescription("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create content version."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.primaryDark }} />
        <div className="space-y-1 text-sm" style={{ color: T.muted }}>
          <p style={{ color: T.text }}>
            <strong>Content version</strong> marks a snapshot of museum content (exhibits, media, AR assets, etc.).
          </p>
          <p>
            Each version has a code (e.g. <code className="text-xs">1.0.0</code>) and a change description.
            After creating a version, use{" "}
            <Link
              href="/content-manager/offline-packages"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: T.primaryDark }}
            >
              Offline Packages
            </Link>{" "}
            to build downloadable data for the mobile app.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-2xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          {versions.length} version{versions.length === 1 ? "" : "s"}
        </p>
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
          {showForm ? "Close" : "Create version"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Version number *
              </label>
              <input
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="1.0.0"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm" style={{ color: T.muted }}>
                Change description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. First release with Dong Son exhibits"
                className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>
              {error}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: T.primary, color: T.surface }}
            >
              {isSubmitting ? "Creating…" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {versions.length === 0 ? (
          <p className="px-8 py-16 text-center text-sm" style={{ color: T.muted }}>
            No content versions yet. Create one to start packaging offline data.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: "rgba(245,230,200,0.35)",
                }}
              >
                {["ID", "Version", "Status", "Description", "Created"].map((h) => (
                  <th key={h} className="px-5 py-4 font-medium" style={{ color: T.mutedLight }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                    {item.id}
                  </td>
                  <td className="px-5 py-4" style={{ color: T.text }}>
                    {item.versionNumber}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td
                    className="max-w-xs truncate px-5 py-4"
                    style={{ color: T.muted }}
                    title={item.changeDescription ?? undefined}
                  >
                    {item.changeDescription?.trim() || "—"}
                  </td>
                  <td className="px-5 py-4" style={{ color: T.muted }}>
                    {item.createdAt?.slice(0, 10) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
