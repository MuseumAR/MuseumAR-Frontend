"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { labelStatus } from "@/lib/status-labels";
import {
  getDisplayError,
  getFirstValidationError,
  validateCreateArtifact,
} from "@/lib/validation";
import type { Artifact } from "@/types";
import type { AgeGroupDto, CategoryDto, MuseumMapDto, RoomDto, TagDto } from "@/types/api";
import {
  updateExhibit,
  uploadArAsset,
  uploadExhibitAudio,
  uploadExhibitImage,
} from "@/services/content-manager";
import {
  categoryDisplayName,
  syncExhibitTags,
} from "@/services/content-manager/taxonomy.service";
import { ArAssetsSection } from "@/components/content-manager/ar-assets-section";

export function UpdateArtifactForm({
  artifact,
  museumId,
  categories,
  ageGroups,
  tags,
  maps = [],
  rooms = [],
  initialCategoryId,
  initialAgeGroupId,
  initialEra,
  initialHistoricalEvent,
  initialTagIds,
  initialMapId,
  initialRoomId,
  initialTranslations = [],
}: {
  artifact: Artifact;
  museumId: number;
  categories: CategoryDto[];
  ageGroups: AgeGroupDto[];
  tags: TagDto[];
  maps?: MuseumMapDto[];
  rooms?: RoomDto[];
  initialCategoryId?: number | null;
  initialAgeGroupId?: number | null;
  initialEra?: string;
  initialHistoricalEvent?: string;
  initialTagIds?: number[];
  initialMapId?: number | null;
  initialRoomId?: number | null;
  initialTranslations?: Array<{
    languageCode: string;
    title: string;
    description?: string | null;
    audioUrl?: string | null;
  }>;
}) {
  const router = useRouter();
  const imageRef = useRef<HTMLInputElement>(null);
  const arRef = useRef<HTMLInputElement>(null);
  const audioRefVi = useRef<HTMLInputElement>(null);
  const audioRefEn = useRef<HTMLInputElement>(null);

  const translationVi = initialTranslations?.find((t) => t.languageCode === "vi");
  const translationEn = initialTranslations?.find((t) => t.languageCode === "en");

  const [titleVi, setTitleVi] = useState(translationVi?.title ?? artifact.name);
  const [titleEn, setTitleEn] = useState(translationEn?.title ?? "");
  const [descriptionVi, setDescriptionVi] = useState(translationVi?.description ?? artifact.description);
  const [descriptionEn, setDescriptionEn] = useState(translationEn?.description ?? "");

  const [exhibitCode, setExhibitCode] = useState(
    /^EX-\d+$/i.test(artifact.id) ? "" : artifact.id,
  );
  const [categoryId, setCategoryId] = useState(
    initialCategoryId != null ? String(initialCategoryId) : "",
  );
  const [ageGroupId, setAgeGroupId] = useState(
    initialAgeGroupId != null ? String(initialAgeGroupId) : "",
  );
  const [era, setEra] = useState(initialEra ?? "");
  const [historicalEvent, setHistoricalEvent] = useState(initialHistoricalEvent ?? "");
  const [mapId, setMapId] = useState(initialMapId != null ? String(initialMapId) : "");
  const [roomId, setRoomId] = useState(initialRoomId != null ? String(initialRoomId) : "");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialTagIds ?? []);

  const availableRooms = useMemo(
    () => rooms.filter((r) => !mapId || !r.mapId || String(r.mapId) === mapId),
    [rooms, mapId],
  );
  const [imagePreview, setImagePreview] = useState<string | null>(artifact.image);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [arFile, setArFile] = useState<File | null>(null);
  const [arPreview, setArPreview] = useState<string | null>(
    artifact.arOverlayUrl && /\.(png|jpg|jpeg|webp)$/i.test(artifact.arOverlayUrl)
      ? artifact.arOverlayUrl
      : null
  );
  const [audioFileVi, setAudioFileVi] = useState<File | null>(null);
  const [audioFileEn, setAudioFileEn] = useState<File | null>(null);

  const existingAudioVi = translationVi?.audioUrl ?? null;
  const existingAudioEn = translationEn?.audioUrl ?? null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exhibitId =
    artifact.exhibitId ?? Number(artifact.id.replace(/^EX-/i, ""));

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: categoryDisplayName(c) })),
    [categories],
  );

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateCreateArtifact({ name: titleVi.trim() || titleEn.trim() });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    if (!exhibitId || Number.isNaN(exhibitId)) {
      setError("Could not find this artifact.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const translationsPayload = [];
      if (titleVi.trim()) {
        translationsPayload.push({
          exhibitId,
          languageCode: "vi",
          title: titleVi.trim(),
          description: descriptionVi.trim() || undefined,
        });
      }
      if (titleEn.trim()) {
        translationsPayload.push({
          exhibitId,
          languageCode: "en",
          title: titleEn.trim(),
          description: descriptionEn.trim() || undefined,
        });
      }

      await updateExhibit(exhibitId, {
        museumId,
        categoryId: categoryId ? Number(categoryId) : undefined,
        exhibitCode: exhibitCode.trim() || undefined,
        status: artifact.status === "Published" ? "Published" : "Draft",
        mapId: mapId ? Number(mapId) : undefined,
        roomId: roomId ? Number(roomId) : undefined,
        exhibitMetadata: {
          ageGroupId: ageGroupId ? Number(ageGroupId) : undefined,
          era: era.trim() || undefined,
          historicalEvent: historicalEvent.trim() || undefined,
        },
        translations: translationsPayload,
      });

      const displayTitle = titleVi.trim() || titleEn.trim() || artifact.name;
      if (imageFile) await uploadExhibitImage(exhibitId, imageFile, displayTitle);
      if (audioFileVi) await uploadExhibitAudio(exhibitId, "vi", audioFileVi);
      if (audioFileEn) await uploadExhibitAudio(exhibitId, "en", audioFileEn);
      if (arFile) {
        const arType = arFile.type.startsWith("image/") ? "OverlayImage" : "Model3D";
        await uploadArAsset(exhibitId, arType, arFile);
      }
      await syncExhibitTags(exhibitId, selectedTagIds);

      router.push(`/content-manager/artifact/${artifact.id}`);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Could not update artifact."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-8 pb-10">
      <Link
        href={`/content-manager/artifact/${artifact.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm"
        style={{ color: T.muted }}
      >
        <span>←</span> Back to artifact
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Update artifact
        </h1>
        <StatusBadge status={artifact.status} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl p-8"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-48">
            <UploadBox
              label={imageFile?.name ?? "Image"}
              preview={imagePreview}
              onClick={() => imageRef.current?.click()}
            />
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />
            <UploadBox
              label={
                arFile?.name ??
                (artifact.arOverlayUrl
                  ? `✓ AR: ${fileNameFromUrl(artifact.arOverlayUrl)}`
                  : artifact.arModelStatus === "Active"
                    ? "✓ AR asset is active (Click to replace)"
                    : "AR asset (Image/3D)")
              }
              preview={arPreview}
              onClick={() => arRef.current?.click()}
            />
            <input
              ref={arRef}
              type="file"
              accept="image/*,.glb,.gltf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setArFile(file);
                if (file.type.startsWith("image/")) {
                  setArPreview(URL.createObjectURL(file));
                } else {
                  setArPreview(null);
                }
              }}
            />
             <UploadBox
              label={
                audioFileVi?.name ??
                (existingAudioVi
                  ? `✓ Audio VI: ${fileNameFromUrl(existingAudioVi)}`
                  : "Vietnamese audio")
              }
              onClick={() => audioRefVi.current?.click()}
            />
            <input
              ref={audioRefVi}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAudioFileVi(file);
              }}
            />
            <UploadBox
              label={
                audioFileEn?.name ??
                (existingAudioEn
                  ? `✓ Audio EN: ${fileNameFromUrl(existingAudioEn)}`
                  : "English audio")
              }
              onClick={() => audioRefEn.current?.click()}
            />
            <input
              ref={audioRefEn}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAudioFileEn(file);
              }}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title (Vietnamese) *" value={titleVi} onChange={setTitleVi} placeholder="Vietnamese title" />
              <Field label="Title (English)" value={titleEn} onChange={setTitleEn} placeholder="English title" />
              <Field label="Artifact code" value={exhibitCode} onChange={setExhibitCode} placeholder="CAT-001" />
              <SelectField
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions.map((c) => ({ value: String(c.id), label: c.label }))}
              />
              <SelectField
                label="Age group"
                value={ageGroupId}
                onChange={setAgeGroupId}
                options={ageGroups.map((g) => ({ value: String(g.id), label: g.groupName }))}
              />
              <SelectField
                label="Floor / Map"
                value={mapId}
                onChange={(val) => {
                  setMapId(val);
                  setRoomId("");
                }}
                options={maps.map((m) => ({
                  value: String(m.id),
                  label: `${m.floorNumber != null ? `Floor ${m.floorNumber}` : "Floor"}${m.mapName ? ` (${m.mapName})` : ""}`,
                }))}
              />
              <SelectField
                label="Exhibition room"
                value={roomId}
                onChange={setRoomId}
                options={availableRooms.map((r) => ({
                  value: String(r.id),
                  label: `${r.roomCode} - ${r.roomName}`,
                }))}
              />
              <Field label="Era" value={era} onChange={setEra} placeholder="e.g. Nguyen dynasty" />
              <Field
                label="Historical event"
                value={historicalEvent}
                onChange={setHistoricalEvent}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: T.muted }}>
                  Description (Vietnamese)
                </label>
                <textarea
                  value={descriptionVi}
                  onChange={(e) => setDescriptionVi(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm" style={{ color: T.muted }}>
                  Description (English)
                </label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                />
              </div>
            </div>
            </div>
            {tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm" style={{ color: T.muted }}>Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          background: active ? "rgba(200,155,69,0.25)" : T.bg,
                          border: `1px solid ${T.border}`,
                          color: active ? T.primaryDark : T.muted,
                        }}
                      >
                        {tag.tagName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {error && (
              <p
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
              >
                {error}
              </p>
            )}
          </div>
        </div>

        {exhibitId && !Number.isNaN(exhibitId) ? (
          <div className="mt-8 border-t pt-6" style={{ borderColor: T.border }}>
            <ArAssetsSection exhibitId={exhibitId} />
          </div>
        ) : null}

        <div className="mt-8 flex justify-end gap-3">
          <Link
            href={`/content-manager/artifact/${artifact.id}`}
            className="rounded-xl px-5 py-2 text-sm"
            style={{ border: `1px solid ${T.border}`, color: T.muted }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl px-6 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
            }}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm" style={{ color: T.muted }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
      >
        <option value="">None</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function UploadBox({
  label,
  preview,
  onClick,
}: {
  label: string;
  preview?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[5rem] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed px-2 py-3 text-center text-xs"
      style={{ borderColor: T.border, background: "rgba(200,155,69,0.08)", color: T.muted }}
    >
      {preview ? (
        <img src={preview} alt="" className="h-full max-h-24 w-full object-cover" />
      ) : (
        label
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: Artifact["status"] }) {
  const styles = {
    Published: { bg: "rgba(79,125,74,0.12)", color: T.success },
    Draft: { bg: "rgba(200,155,69,0.15)", color: T.primaryDark },
    Pending: { bg: "rgba(109,90,69,0.12)", color: T.muted },
  };
  const s = styles[status];
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {labelStatus(status)}
    </span>
  );
}

function fileNameFromUrl(url: string | null | undefined) {
  if (!url) return "";
  try {
    const path = new URL(url, "https://local").pathname;
    const name = path.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : url;
  } catch {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  }
}
