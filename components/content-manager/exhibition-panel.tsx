"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import { createExhibitionEntry, uploadExhibitionImage } from "@/services/content-manager/exhibition.service";
import { createThemeEntry } from "@/services/content-manager";
import type { ExhibitionDto, ThemeDto } from "@/types/api";

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

export function ExhibitionPanel({
  exhibitions,
  museumId,
  themes,
}: {
  exhibitions: ExhibitionDto[];
  museumId: number;
  themes: ThemeDto[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [themeInput, setThemeInput] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
              museumId,
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

      const exhibition = await createExhibitionEntry({
        museumId,
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

      setShowForm(false);
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setThemeInput("");
      setThumbnailFile(null);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not create exhibition."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {exhibitions.length}
          </span>
          {` exhibitions`}
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
          {showForm ? "Close" : "Create exhibition"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6 space-y-4"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="space-y-1.5">
            <label className="block text-sm" style={{ color: T.muted }}>Exhibition name</label>
            <input
              type="text"
              required
              placeholder="e.g. Nature and Archaeology of Saigon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm" style={{ color: T.muted }}>Description</label>
            <textarea
              placeholder="Enter a detailed description of the exhibition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }} />
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
            <div className="space-y-1.5">
              <label className="block text-sm" style={{ color: T.muted }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}>
                <option value="Active">{labelStatus("Active")}</option>
                <option value="Inactive">{labelStatus("Inactive")}</option>
                <option value="Ended">{labelStatus("Ended")}</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
              <label className="block text-sm" style={{ color: T.muted }}>Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[rgba(200,155,69,0.15)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#A67C1E]"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
          </div>
          {error && <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>{error}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exhibitions.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No exhibitions yet.</p>
        ) : (
          exhibitions.map((item) => (
            <Link
              key={item.id}
              href={`/content-manager/exhibition/${item.id}`}
              className="block rounded-3xl p-6 transition-colors hover:opacity-95"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              {item.thumbnailUrl ? (
                <div
                  className="mb-4 h-48 overflow-hidden rounded-2xl"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : null}
              <h3 className="font-semibold text-lg" style={{ fontFamily: cinzel, color: T.primaryDark }}>
                {item.name || `Exhibition #${item.id}`}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: T.mutedLight }}>ID: {item.id}</p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: T.muted }}>
                <div className="flex justify-between">
                  <span>Theme</span>
                  <span style={{ color: T.text }}>{item.themeName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Start</span>
                  <span style={{ color: T.text }}>{item.startDate?.slice(0, 10) ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>End</span>
                  <span style={{ color: T.text }}>{item.endDate?.slice(0, 10) ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium" style={{ color: T.primaryDark }}>
                View details →
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
