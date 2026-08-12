"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Info,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import {
  createVersionEntry,
  getVersionList,
} from "@/services/content-manager/content-version.service";
import type { ContentVersionDto } from "@/types/api";

function suggestNextVersionNumber(versions: ContentVersionDto[]): string {
  if (versions.length === 0) return "v1.0.0";
  const latest = versions[0].versionNumber.trim();
  const match = latest.match(/^(.*?)(\d+)(\D*)$/);
  if (!match) return `${latest}-2`;
  const next = String(Number(match[2]) + 1);
  return `${match[1]}${next}${match[3]}`;
}

const STEPS = [
  {
    n: 1,
    title: "Create a Content Version",
    body: "The next version number is suggested for you. Add a short change note, then save.",
  },
  {
    n: 2,
    title: "Work with the latest",
    body: "The UI highlights the newest version. Older ones stay in history (do not delete) so past offline packages still resolve.",
  },
  {
    n: 3,
    title: "Generate Offline Package",
    body: "Click “Create package” — the Version ID is filled automatically. No need to memorize or type it.",
  },
] as const;

export function ContentVersionsPanel({
  initialVersions,
  loadError: initialLoadError = null,
}: {
  initialVersions: ContentVersionDto[];
  loadError?: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [versionNumber, setVersionNumber] = useState(() =>
    suggestNextVersionNumber(initialVersions),
  );
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [versions, setVersions] = useState<ContentVersionDto[]>(initialVersions);
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const latest = versions[0] ?? null;
  const history = versions.slice(1);

  const existingNumbers = useMemo(
    () => new Set(versions.map((v) => v.versionNumber.trim().toLowerCase())),
    [versions],
  );

  async function refreshList() {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const result = await getVersionList();
      setVersions(result.versions);
      setLoadError(result.loadError);
      if (!showForm) {
        setVersionNumber(suggestNextVersionNumber(result.versions));
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const number = versionNumber.trim();
    if (!number) {
      setError("Version number is required (e.g. v1.0.1).");
      return;
    }
    if (existingNumbers.has(number.toLowerCase())) {
      setError(
        `Version "${number}" already exists. Suggested: ${suggestNextVersionNumber(versions)}.`,
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createVersionEntry(number, description.trim());
      setLastCreatedId(result.id);
      setDescription("");
      setShowForm(false);
      await refreshList();
      setVersionNumber(
        suggestNextVersionNumber([
          {
            id: result.id,
            museumId: 0,
            versionNumber: result.versionNumber,
            changeDescription: result.changeDescription,
            status: "Draft",
            createdAt: new Date().toISOString(),
          },
          ...versions,
        ]),
      );
    } catch (err) {
      setError(getDisplayError(err, "Unable to create content version."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <section
        className="rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(200,155,69,0.15)", color: T.primaryDark }}
          >
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: cinzel, color: T.text }}
            >
              How do Content Versions work?
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: T.muted }}>
              Each version is a content <strong style={{ color: T.text }}>snapshot</strong>.
              Do not delete an old version when something was “wrong” — an offline package may
              still reference that ID. Create the{" "}
              <strong style={{ color: T.text }}>next version</strong> and work with the latest
              one instead.
            </p>
          </div>
        </div>

        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-2xl p-4"
              style={{ background: "rgba(245,230,200,0.35)", border: `1px solid ${T.border}` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: T.primaryDark }}
                >
                  {step.n}
                </span>
                <span className="text-sm font-semibold" style={{ color: T.text }}>
                  {step.title}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {lastCreatedId != null && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(79,125,74,0.12)", color: T.success }}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            Created version ID{" "}
            <strong className="tabular-nums" style={{ color: T.text }}>
              #{lastCreatedId}
            </strong>
            . You can generate an offline package now.
          </span>
          <Link
            href={`/content-manager/offline-packages?versionId=${lastCreatedId}`}
            className="ml-auto inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold"
            style={{ background: T.primaryDark, color: T.surface }}
          >
            <Package className="h-4 w-4" />
            Create package (ID prefilled)
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {loadError && (
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(139,46,46,0.1)", color: "#8B2E2E" }}
        >
          {loadError}
          <button
            type="button"
            onClick={() => void refreshList()}
            className="ml-3 font-semibold underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Latest version focus */}
      {latest && (
        <section
          className="rounded-3xl p-6"
          style={{
            background: T.surface,
            border: `2px solid ${T.primary}`,
            boxShadow: "0 8px 24px rgba(200,155,69,0.12)",
          }}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: "rgba(200,155,69,0.2)", color: T.primaryDark }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Current / latest
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: "rgba(200,155,69,0.12)", color: T.primaryDark }}
            >
              {latest.status}
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
                Version ID (auto-filled when creating a package)
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: T.text }}>
                #{latest.id}
              </p>
              <p className="mt-2 text-lg font-semibold" style={{ color: T.text }}>
                {latest.versionNumber}
              </p>
              <p className="mt-1 max-w-xl text-sm" style={{ color: T.muted }}>
                {latest.changeDescription?.trim() || "No description"}
              </p>
              <p className="mt-2 text-xs" style={{ color: T.mutedLight }}>
                Created: {latest.createdAt?.slice(0, 10) ?? "—"}
              </p>
            </div>
            <Link
              href={`/content-manager/offline-packages?versionId=${latest.id}`}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Package className="h-4 w-4" />
              Create Offline Package
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          {versions.length === 0
            ? "No versions yet"
            : `${versions.length} version${versions.length === 1 ? "" : "s"} · focus on the latest`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshList()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
              if (!showForm) setVersionNumber(suggestNextVersionNumber(versions));
            }}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Close" : "Create next version"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-medium" style={{ color: T.text }}>
            <Tag className="h-4 w-4" style={{ color: T.primaryDark }} />
            Create the next version (number prefilled)
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>
                Version number *
              </label>
              <input
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="v1.0.1"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
              <p className="text-[11px]" style={{ color: T.muted }}>
                Auto-incremented from the previous version. You can edit it if it is still unique.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm" style={{ color: T.muted }}>
                Change description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Updated ground-floor exhibits + added VI audio"
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
              {isSubmitting ? "Creating…" : "Save new version"}
            </button>
          </div>
        </form>
      )}

      {!latest && !loadError && (
        <p className="rounded-3xl px-8 py-16 text-center text-sm" style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}` }}>
          No content version yet. Click <strong>Create next version</strong> to get started.
        </p>
      )}

      {/* History — collapsed, not deleted */}
      {history.length > 0 && (
        <section
          className="overflow-hidden rounded-3xl"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
            style={{ color: T.text }}
          >
            <span>
              Older version history ({history.length}) — kept, not deleted
            </span>
            <ChevronDown
              className={`h-4 w-4 transition ${showHistory ? "rotate-180" : ""}`}
              style={{ color: T.muted }}
            />
          </button>
          {showHistory && (
            <table className="w-full text-left text-sm" style={{ borderTop: `1px solid ${T.border}` }}>
              <thead>
                <tr style={{ background: "rgba(245,230,200,0.25)" }}>
                  {["ID", "Version", "Status", "Description", "Created", ""].map((h) => (
                    <th key={h || "a"} className="px-5 py-3 text-xs font-medium" style={{ color: T.mutedLight }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderTop: `1px solid ${T.border}`, opacity: 0.85 }}>
                    <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: T.muted }}>
                      #{item.id}
                    </td>
                    <td className="px-5 py-3" style={{ color: T.text }}>
                      {item.versionNumber}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: T.muted }}>
                      {item.status}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3" style={{ color: T.muted }}>
                      {item.changeDescription?.trim() || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: T.muted }}>
                      {item.createdAt?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/content-manager/offline-packages?versionId=${item.id}`}
                        className="text-xs font-semibold underline-offset-2 hover:underline"
                        style={{ color: T.primaryDark }}
                      >
                        Use this ID
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
