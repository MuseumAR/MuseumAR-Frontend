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
}) {
  const router = useRouter();
  const imageRef = useRef<HTMLInputElement>(null);
  const arRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(artifact.name);
  const [exhibitCode, setExhibitCode] = useState(
    /^EX-\d+$/i.test(artifact.id) ? "" : artifact.id,
  );
  const [description, setDescription] = useState(artifact.description);
  const [languageCode, setLanguageCode] = useState("vi");
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
  const [audioFile, setAudioFile] = useState<File | null>(null);
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

    const validation = validateCreateArtifact({ name: title });
    if (!validation.valid) {
      setError(getFirstValidationError(validation));
      return;
    }

    if (!exhibitId || Number.isNaN(exhibitId)) {
      setError("Không tìm thấy hiện vật này.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
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
        translations: [
          {
            exhibitId,
            languageCode,
            title: title.trim(),
            description: description.trim() || undefined,
          },
        ],
      });

      if (imageFile) await uploadExhibitImage(exhibitId, imageFile, title.trim());
      if (audioFile) await uploadExhibitAudio(exhibitId, languageCode, audioFile);
      if (arFile) {
        const arType = arFile.type.startsWith("image/") ? "OverlayImage" : "Model3D";
        await uploadArAsset(exhibitId, arType, arFile);
      }
      await syncExhibitTags(exhibitId, selectedTagIds);

      router.push(`/content-manager/artifact/${artifact.id}`);
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể cập nhật hiện vật."));
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
        <span>←</span> Quay lại hiện vật
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
          Cập nhật hiện vật
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
              label={imageFile?.name ?? "Hình ảnh"}
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
                    ? "✓ Tài sản AR đang hoạt động (Nhấp để đổi)"
                    : "Tài sản AR (Hình ảnh/3D)")
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
                audioFile?.name ??
                (artifact.audioUrl
                  ? `✓ Âm thanh: ${fileNameFromUrl(artifact.audioUrl)}`
                  : artifact.audio === "Active"
                    ? "✓ Hướng dẫn âm thanh đang hoạt động (Nhấp để đổi)"
                    : "Hướng dẫn âm thanh")
              }
              onClick={() => audioRef.current?.click()}
            />
            <input
              ref={audioRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAudioFile(file);
              }}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tiêu đề *" value={title} onChange={setTitle} placeholder="Tiêu đề hiện vật" />
              <Field label="Mã hiện vật" value={exhibitCode} onChange={setExhibitCode} placeholder="CAT-001" />
              <Field label="Ngôn ngữ" value={languageCode} onChange={setLanguageCode} placeholder="vi" />
              <SelectField
                label="Danh mục"
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions.map((c) => ({ value: String(c.id), label: c.label }))}
              />
              <SelectField
                label="Nhóm tuổi"
                value={ageGroupId}
                onChange={setAgeGroupId}
                options={ageGroups.map((g) => ({ value: String(g.id), label: g.groupName }))}
              />
              <SelectField
                label="Tầng / Bản đồ"
                value={mapId}
                onChange={(val) => {
                  setMapId(val);
                  setRoomId("");
                }}
                options={maps.map((m) => ({
                  value: String(m.id),
                  label: `${m.floorNumber != null ? `Tầng ${m.floorNumber}` : "Tầng"}${m.mapName ? ` (${m.mapName})` : ""}`,
                }))}
              />
              <SelectField
                label="Phòng trưng bày"
                value={roomId}
                onChange={setRoomId}
                options={availableRooms.map((r) => ({
                  value: String(r.id),
                  label: `${r.roomCode} - ${r.roomName}`,
                }))}
              />
              <Field label="Thời kỳ" value={era} onChange={setEra} placeholder="VD: triều Nguyễn" />
              <Field
                label="Sự kiện lịch sử"
                value={historicalEvent}
                onChange={setHistoricalEvent}
                placeholder="Không bắt buộc"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm" style={{ color: T.muted }}>
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>
            {tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm" style={{ color: T.muted }}>Thẻ</p>
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
            Hủy
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
            {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
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
        <option value="">Không</option>
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
