"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { deleteExhibition, updateExhibition, uploadExhibitionImage } from "@/services/content-manager/exhibition.service";
import type { ExhibitionDto } from "@/types/api";

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

  return (
    <div className="px-8 pb-10">
      <Link
        href="/content-manager/exhibition"
        className="mb-6 inline-flex items-center gap-2 text-sm"
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Ended">Ended</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm" style={{ color: T.muted }}>New Thumbnail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(200,155,69,0.15)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#A67C1E]"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowEdit(false)} className="rounded-xl px-5 py-2 text-sm font-medium" style={{ border: `1px solid ${T.border}`, color: T.text }}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
                {isSubmitting ? "Saving…" : "Save Changes"}
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
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-sm"
                  style={{ color: T.mutedLight }}
                >
                  No thumbnail
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
                <InfoRow label="Status" value={exhibition.status} />
                <InfoRow label="Start date" value={formatDate(exhibition.startDate)} />
                <InfoRow label="End date" value={formatDate(exhibition.endDate)} />
              </dl>
            </div>
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
