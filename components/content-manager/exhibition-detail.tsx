"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import { labelStatus } from "@/lib/status-labels";
import {
  deleteExhibition,
  updateExhibition,
  uploadExhibitionImage,
} from "@/services/content-manager/exhibition.service";
import {
  getExhibits,
  getExhibitsByExhibition,
  assignExhibitsToExhibition,
  removeExhibitFromExhibition,
} from "@/services/content-manager/content-api.service";
import { createThemeEntry } from "@/services/content-manager/taxonomy.service";
import type { ExhibitionDto, ExhibitDto, ThemeDto } from "@/types/api";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  const inactive = status === "Inactive";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: active
          ? "rgba(79,125,74,0.12)"
          : inactive
            ? "rgba(200,155,69,0.15)"
            : "rgba(109,90,69,0.12)",
        color: active ? T.success : inactive ? T.primaryDark : T.muted,
      }}
    >
      {labelStatus(status)}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function ExhibitionDetail({
  exhibition,
  themes = [],
}: {
  exhibition: ExhibitionDto;
  themes?: ThemeDto[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState(exhibition.name ?? "");
  const [description, setDescription] = useState(exhibition.description ?? "");
  const [startDate, setStartDate] = useState(exhibition.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(exhibition.endDate?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(exhibition.status);
  const [themeInput, setThemeInput] = useState(exhibition.themeName ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exhibits Management State
  const [exhibitsInExhibition, setExhibitsInExhibition] = useState<ExhibitDto[]>([]);
  const [allMuseumExhibits, setAllMuseumExhibits] = useState<ExhibitDto[]>([]);
  const [loadingExhibits, setLoadingExhibits] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExhibitId, setSelectedExhibitId] = useState<number | "">("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const { success, showSuccess } = useSuccessToast();

  const loadExhibitsData = async () => {
    setLoadingExhibits(true);
    try {
      const [linked, all] = await Promise.all([
        getExhibitsByExhibition(exhibition.id).catch(() => []),
        getExhibits().catch(() => []),
      ]);
      setExhibitsInExhibition(linked);
      setAllMuseumExhibits(all);
    } catch (err) {
      console.error("Failed to load exhibits data", err);
    } finally {
      setLoadingExhibits(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getExhibitsByExhibition(exhibition.id).catch(() => [] as ExhibitDto[]),
      getExhibits().catch(() => [] as ExhibitDto[]),
    ]).then(([linked, all]) => {
      if (cancelled) return;
      setExhibitsInExhibition(linked);
      setAllMuseumExhibits(all);
      setLoadingExhibits(false);
    });
    return () => {
      cancelled = true;
    };
  }, [exhibition.id]);

  const handleAssignExhibit = async () => {
    if (!selectedExhibitId) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      await assignExhibitsToExhibition(exhibition.id, [Number(selectedExhibitId)]);
      setSelectedExhibitId("");
      setShowAddModal(false);
      showSuccess("Artifact assigned to this exhibition.");
      await loadExhibitsData();
    } catch (err) {
      setAssignError(getDisplayError(err, "Could not assign artifact to exhibition."));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveExhibit = async (exhibitId: number) => {
    if (!confirm("Remove this artifact from the exhibition?")) return;
    try {
      await removeExhibitFromExhibition(exhibition.id, exhibitId);
      showSuccess("Artifact removed from this exhibition.");
      await loadExhibitsData();
    } catch (err) {
      alert(getDisplayError(err, "Could not remove artifact."));
    }
  };

  async function handleDelete() {
    if (!confirm("Delete this exhibition?")) return;
    try {
      await deleteExhibition(exhibition.id);
      router.push("/content-manager/exhibition");
      router.refresh();
    } catch (err) {
      alert(getDisplayError(err, "Could not delete exhibition."));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name.trim()) {
      setError("Please enter an exhibition name.");
      setIsSubmitting(false);
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be on or after the start date.");
      setIsSubmitting(false);
      return;
    }

    try {
      let finalThemeId: number | undefined = undefined;
      const trimmedTheme = themeInput.trim();
      if (trimmedTheme) {
        const existing = themes.find(
          (t) => t.themeName.toLowerCase() === trimmedTheme.toLowerCase()
        );
        if (existing) {
          finalThemeId = existing.id;
        } else {
          try {
            const newTheme = await createThemeEntry({
              museumId: exhibition.museumId,
              themeName: trimmedTheme,
            });
            finalThemeId = newTheme.id;
          } catch (err) {
            setError(getDisplayError(err, "Could not create a new theme."));
            setIsSubmitting(false);
            return;
          }
        }
      }

      await updateExhibition(exhibition.id, {
        museumId: exhibition.museumId,
        themeId: finalThemeId,
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
      });

      if (thumbnailFile) {
        await uploadExhibitionImage(exhibition.id, thumbnailFile);
      }

      setShowEdit(false);
      showSuccess("Exhibition updated.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not update exhibition."));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter unassigned exhibits for selection dropdown
  const unassignedExhibits = allMuseumExhibits.filter(
    (e) => !exhibitsInExhibition.some((linked) => linked.id === e.id)
  );

  return (
    <div className="px-8 pb-10">
      <Link
        href="/content-manager/exhibition"
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        ← Back to list
      </Link>

      <div className="space-y-6">
        <SuccessBanner message={success} />
        {/* Exhibition Metadata Header Card */}
        <div
          className="rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          {showEdit ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
                Edit exhibition
              </h3>
              {error && <p className="text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
              
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Exhibition name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>End date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
                    <option value="Active">{labelStatus("Active")}</option>
                    <option value="Inactive">{labelStatus("Inactive")}</option>
                    <option value="Ended">{labelStatus("Ended")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>New thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(200,155,69,0.15)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#A67C1E]"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="block text-sm" style={{ color: T.muted }}>Theme</label>
                  <input
                    type="text"
                    list="theme-suggestions"
                    placeholder="Select or type a new theme..."
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                  <datalist id="theme-suggestions">
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.themeName} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEdit(false)} className="rounded-xl px-5 py-2 text-sm font-medium" style={{ border: `1px solid ${T.border}`, color: T.text }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
                  {isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-8 md:flex-row">
              <div
                className="h-56 w-full shrink-0 overflow-hidden rounded-2xl md:h-64 md:w-72"
                style={{ border: `1px solid ${T.border}`, background: "rgba(200,155,69,0.08)" }}
              >
                {exhibition.thumbnailUrl ? (
                  <img
                    src={exhibition.thumbnailUrl}
                    alt={exhibition.name || `Exhibition #${exhibition.id}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-sm"
                    style={{ color: T.mutedLight }}
                  >
                    No image yet
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ fontFamily: cinzel, color: T.primaryDark }}
                    >
                      {exhibition.name || `Exhibition #${exhibition.id}`}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: T.mutedLight }}>Exhibition ID: {exhibition.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={exhibition.status} />
                    <button
                      type="button"
                      onClick={() => setShowEdit(true)}
                      className="rounded-xl px-4 py-1.5 text-xs font-medium"
                      style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-xl px-4 py-1.5 text-xs font-medium"
                      style={{ border: `1px solid ${T.danger}`, color: T.danger, background: "rgba(180,40,40,0.05)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {exhibition.description && (
                  <p className="text-sm mt-1" style={{ color: T.text }}>
                    {exhibition.description}
                  </p>
                )}

                <dl className="grid gap-3 text-sm sm:grid-cols-2 mt-4 pt-4 border-t" style={{ borderColor: T.border }}>
                  <InfoRow label="Museum ID" value={String(exhibition.museumId)} />
                  <InfoRow label="Status" value={labelStatus(exhibition.status)} />
                  <InfoRow label="Start date" value={formatDate(exhibition.startDate)} />
                  <InfoRow label="End date" value={formatDate(exhibition.endDate)} />
                  <InfoRow label="Theme" value={exhibition.themeName || "—"} />
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Exhibits Management Card */}
        <div
          className="rounded-3xl p-6 shadow-sm"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ fontFamily: cinzel, color: T.primaryDark }}>
                Artifacts in this exhibition ({exhibitsInExhibition.length})
              </h3>
              <p className="text-xs" style={{ color: T.mutedLight }}>
                Links artifacts to this event. Floor / Room (map and AR location) is not changed here.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAssignError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-opacity hover:opacity-90"
              style={{ background: T.primary, color: T.surface }}
            >
              + Assign artifact to exhibition
            </button>
          </div>

          {loadingExhibits ? (
            <div className="py-8 text-center text-xs font-medium" style={{ color: T.muted }}>
              Loading artifacts...
            </div>
          ) : exhibitsInExhibition.length === 0 ? (
            <div
              className="rounded-2xl py-8 text-center text-xs font-medium"
              style={{ background: T.bg, color: T.muted }}
            >
              No artifacts assigned to this exhibition yet. Use the button above to assign artifacts.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {exhibitsInExhibition.map((ex) => {
                const title = ex.translations?.[0]?.title || `Artifact #${ex.id}`;
                const code = ex.exhibitCode || `EX-${ex.id}`;
                return (
                  <div
                    key={ex.id}
                    className="flex items-center gap-3.5 rounded-2xl p-3.5 border transition-colors"
                    style={{ background: T.bg, borderColor: T.border }}
                  >
                    {ex.thumbnailUrl ? (
                      <img
                        src={ex.thumbnailUrl}
                        alt={title}
                        className="h-14 w-14 rounded-xl object-cover shrink-0"
                        style={{ border: `1px solid ${T.border}` }}
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-bold text-xs"
                        style={{ background: T.surface, color: T.mutedLight, border: `1px solid ${T.border}` }}
                      >
                        {code}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate" style={{ color: T.text }}>
                        {title}
                      </h4>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: T.mutedLight }}>
                        Code: {code}
                      </p>
                      {ex.roomName && (
                        <p className="text-[10px] mt-0.5" style={{ color: T.success }}>
                          📍 {ex.roomName}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExhibit(ex.id)}
                      className="rounded-lg p-1.5 text-xs font-medium transition-colors hover:bg-red-50"
                      style={{ color: T.danger }}
                      title="Remove from exhibition"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal / Dialog Gán Hiện vật */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <h3 className="text-base font-bold mb-2" style={{ color: T.primaryDark }}>
              Assign artifact to exhibition
            </h3>
            <p className="text-xs mb-3" style={{ color: T.mutedLight }}>
              Choose an artifact from the museum to assign to &ldquo;{exhibition.name || `#${exhibition.id}`}&rdquo;
            </p>
            <p
              className="mb-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed"
              style={{ background: "rgba(200,155,69,0.12)", color: T.primaryDark }}
            >
              This only attaches the artifact to the exhibition. It does not move it on the map.
              If the piece was physically relocated, update Floor / Room on the artifact edit page so map and AR stay correct.
            </p>

            {assignError && (
              <p className="mb-3 rounded-xl p-2.5 text-xs" style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}>
                {assignError}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: T.text }}>
                  Select artifact:
                </label>
                {unassignedExhibits.length === 0 ? (
                  <p className="text-xs italic py-2" style={{ color: T.muted }}>
                    All museum artifacts are already assigned to this exhibition.
                  </p>
                ) : (
                  <select
                    value={selectedExhibitId}
                    onChange={(e) => setSelectedExhibitId(Number(e.target.value))}
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="">-- Select artifact --</option>
                    {unassignedExhibits.map((ex) => {
                      const title = ex.translations?.[0]?.title || `Artifact #${ex.id}`;
                      const code = ex.exhibitCode || `EX-${ex.id}`;
                      return (
                        <option key={ex.id} value={ex.id}>
                          [{code}] {title}
                        </option>
                      );
                    })}
                  </select>
                )}
                {selectedExhibitId ? (
                  <p className="mt-2 text-xs" style={{ color: T.muted }}>
                    <Link
                      href={`/content-manager/artifact/${selectedExhibitId}/edit`}
                      className="font-semibold underline-offset-2 hover:underline"
                      style={{ color: T.primaryDark }}
                    >
                      Edit Floor / Room
                    </Link>
                    {" "}for this artifact if it changed location.
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold"
                  style={{ border: `1px solid ${T.border}`, color: T.text }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedExhibitId || isAssigning}
                  onClick={handleAssignExhibit}
                  className="rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {isAssigning ? "Assigning…" : "Confirm assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
