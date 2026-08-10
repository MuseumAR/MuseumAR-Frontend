"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { getExhibits } from "@/services/content-manager/content-api.service";
import {
  assignExhibitsToExhibitionEntry,
  deleteExhibition,
  getExhibitionExhibitList,
  removeExhibitFromExhibitionEntry,
  updateExhibition,
  uploadExhibitionImage,
} from "@/services/content-manager/exhibition.service";
import type { ExhibitDto, ExhibitionDto } from "@/types/api";

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
      {status}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

function exhibitTitle(ex: ExhibitDto) {
  return (
    ex.translations?.[0]?.title?.trim() ||
    ex.exhibitCode ||
    `Exhibit #${ex.id}`
  );
}

export function ExhibitionDetail({ exhibition }: { exhibition: ExhibitionDto }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState(exhibition.name ?? "");
  const [description, setDescription] = useState(exhibition.description ?? "");
  const [startDate, setStartDate] = useState(exhibition.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(exhibition.endDate?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(exhibition.status);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [linkedExhibits, setLinkedExhibits] = useState<ExhibitDto[]>([]);
  const [allExhibits, setAllExhibits] = useState<ExhibitDto[]>([]);
  const [exhibitsLoading, setExhibitsLoading] = useState(true);
  const [exhibitsError, setExhibitsError] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
  const [exhibitsBusy, setExhibitsBusy] = useState(false);

  const loadExhibits = useCallback(async () => {
    setExhibitsLoading(true);
    setExhibitsError(null);
    try {
      const [linked, all] = await Promise.all([
        getExhibitionExhibitList(exhibition.id),
        getExhibits(),
      ]);
      setLinkedExhibits(linked);
      setAllExhibits(all);
    } catch (err) {
      setExhibitsError(getDisplayError(err, "Không thể tải hiện vật của exhibition."));
      setLinkedExhibits([]);
    } finally {
      setExhibitsLoading(false);
    }
  }, [exhibition.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadExhibits();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadExhibits]);

  const linkedIds = useMemo(
    () => new Set(linkedExhibits.map((e) => e.id)),
    [linkedExhibits],
  );

  const availableToAdd = useMemo(
    () => allExhibits.filter((e) => !linkedIds.has(e.id)),
    [allExhibits, linkedIds],
  );

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this exhibition?")) return;
    try {
      await deleteExhibition(exhibition.id);
      router.push("/content-manager/exhibition");
      router.refresh();
    } catch (err) {
      alert(getDisplayError(err, "Unable to delete exhibition."));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name.trim()) {
      setError("Exhibition Name is required.");
      setIsSubmitting(false);
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be after or equal to Start date.");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateExhibition(exhibition.id, {
        museumId: exhibition.museumId,
        themeId: exhibition.themeId ?? undefined,
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
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to update exhibition."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssign() {
    if (!selectedToAdd.length) return;
    setExhibitsBusy(true);
    setExhibitsError(null);
    try {
      await assignExhibitsToExhibitionEntry(exhibition.id, selectedToAdd);
      setSelectedToAdd([]);
      await loadExhibits();
    } catch (err) {
      setExhibitsError(getDisplayError(err, "Không thể gán hiện vật."));
    } finally {
      setExhibitsBusy(false);
    }
  }

  async function handleRemoveExhibit(exhibitId: number) {
    if (!confirm("Gỡ hiện vật này khỏi exhibition?")) return;
    setExhibitsBusy(true);
    setExhibitsError(null);
    try {
      await removeExhibitFromExhibitionEntry(exhibition.id, exhibitId);
      await loadExhibits();
    } catch (err) {
      setExhibitsError(getDisplayError(err, "Không thể gỡ hiện vật."));
    } finally {
      setExhibitsBusy(false);
    }
  }

  return (
    <div className="px-8 pb-10 space-y-6">
      <Link
        href="/content-manager/exhibition"
        className="mb-2 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        ← Back to list
      </Link>

      <div
        className="rounded-3xl p-6"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {showEdit ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>Edit Exhibition</h3>
            {error && <p className="text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
            
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Exhibition Name</label>
              <input
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
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
                style={{ color: T.muted }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl px-4 py-2 text-sm"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: T.primary, color: T.surface }}
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row">
            {exhibition.thumbnailUrl ? (
              <div className="w-full md:w-64 shrink-0 overflow-hidden rounded-2xl bg-black/5">
                <img
                  src={exhibition.thumbnailUrl}
                  alt={exhibition.name || `Exhibition #${exhibition.id}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

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
                <InfoRow label="Status" value={exhibition.status} />
                <InfoRow label="Start date" value={formatDate(exhibition.startDate)} />
                <InfoRow label="End date" value={formatDate(exhibition.endDate)} />
              </dl>
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-3xl p-6 space-y-4"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
              Hiện vật trong exhibition
            </h3>
            <p className="text-xs mt-1" style={{ color: T.muted }}>
              {linkedExhibits.length} hiện vật đã gán
            </p>
          </div>
          <button
            type="button"
            disabled={exhibitsLoading || exhibitsBusy}
            onClick={() => void loadExhibits()}
            className="rounded-xl px-3 py-1.5 text-xs disabled:opacity-50"
            style={{ border: `1px solid ${T.border}`, color: T.muted }}
          >
            Tải lại
          </button>
        </div>

        {exhibitsError && (
          <p className="text-sm" style={{ color: "#8B2E2E" }}>{exhibitsError}</p>
        )}

        {exhibitsLoading ? (
          <p className="text-sm" style={{ color: T.muted }}>Đang tải…</p>
        ) : linkedExhibits.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>Chưa có hiện vật nào.</p>
        ) : (
          <ul className="space-y-2">
            {linkedExhibits.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm"
                style={{ background: T.bg, border: `1px solid ${T.border}` }}
              >
                <span style={{ color: T.text }}>
                  {ex.exhibitCode ? `${ex.exhibitCode} · ` : ""}
                  {exhibitTitle(ex)}
                </span>
                <button
                  type="button"
                  disabled={exhibitsBusy}
                  onClick={() => void handleRemoveExhibit(ex.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs disabled:opacity-50"
                  style={{ color: "#8B3A22" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Gỡ
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t pt-4 space-y-3" style={{ borderColor: T.border }}>
          <p className="text-sm font-medium" style={{ color: T.text }}>
            Gán thêm hiện vật
          </p>
          {availableToAdd.length === 0 ? (
            <p className="text-xs" style={{ color: T.muted }}>
              Không còn hiện vật nào để gán (hoặc chưa tải được danh sách).
            </p>
          ) : (
            <>
              <select
                multiple
                value={selectedToAdd.map(String)}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                  setSelectedToAdd(opts.filter((n) => Number.isFinite(n)));
                }}
                className="w-full min-h-[140px] rounded-xl px-3 py-2 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                {availableToAdd.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exhibitCode ? `${ex.exhibitCode} · ` : ""}
                    {exhibitTitle(ex)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={exhibitsBusy || selectedToAdd.length === 0}
                onClick={() => void handleAssign()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: T.primary, color: T.surface }}
              >
                <Plus className="h-4 w-4" />
                Gán {selectedToAdd.length || ""} hiện vật
              </button>
            </>
          )}
        </div>
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
