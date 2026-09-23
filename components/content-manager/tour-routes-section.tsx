"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Pencil,
  Plus,
  Route,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import {
  addRouteStop,
  attachRouteThumbnail,
  createRouteEntry,
  deleteRouteEntry,
  getRouteDetail,
  hostRouteThumbnail,
  removeRouteStop,
  reorderStops,
  updateRouteEntry,
} from "@/services/content-manager/maps-routes.service";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import type {
  AgeGroupDto,
  ExhibitDto,
  ExhibitionDto,
  TourRouteDto,
  TourRouteStopDto,
} from "@/types/api";

const fieldStyle = {
  border: `1px solid ${T.border}`,
  background: T.bg,
  color: T.text,
} as const;

const hideYScroll: CSSProperties = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

function hasText(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function hasNum(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function StatusBadge({ status }: { status: string }) {
  const s =
    status === "Active"
      ? { bg: "rgba(79,125,74,0.12)", color: T.success }
      : status === "Inactive"
        ? { bg: "rgba(160,128,96,0.14)", color: T.muted }
        : { bg: "rgba(200,155,69,0.14)", color: T.primaryDark };
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {labelStatus(status)}
    </span>
  );
}

function routeTitle(route: TourRouteDto) {
  const vi = route.translations?.find((t) => t.languageCode === "vi");
  return vi?.routeName?.trim() || route.name?.trim() || "";
}

function routeDescription(route: TourRouteDto) {
  const vi = route.translations?.find((t) => t.languageCode === "vi");
  return vi?.description?.trim() || route.description?.trim() || "";
}

function stopTitle(stop: TourRouteStopDto) {
  return stop.exhibitName?.trim() || stop.exhibitCode?.trim() || "";
}

function stopPlace(stop: TourRouteStopDto) {
  const floor = hasNum(stop.floorNumber) ? `Tầng ${stop.floorNumber}` : "";
  const room = [stop.roomCode, stop.roomName].filter((v) => hasText(v)).join(" · ");
  return [floor, room].filter(Boolean).join(" · ");
}

function exhibitTitle(exhibit: ExhibitDto) {
  const vi = exhibit.translations?.find((t) => t.languageCode === "vi");
  const any = exhibit.translations?.[0];
  return vi?.title || any?.title || exhibit.exhibitCode || "Hiện vật";
}

function exhibitPlace(exhibit: ExhibitDto) {
  const floor = hasNum(exhibit.floorNumber) ? `Tầng ${exhibit.floorNumber}` : "";
  const room = [exhibit.roomCode, exhibit.roomName].filter((v) => hasText(v)).join(" · ");
  return [floor, room].filter(Boolean).join(" · ");
}

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

function sortedStops(route: TourRouteDto) {
  return [...(route.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
}

function moveIds(ids: number[], index: number, dir: -1 | 1) {
  const next = [...ids];
  const j = index + dir;
  if (j < 0 || j >= next.length) return ids;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span style={{ color: T.muted }}>{label}</span>
      {children}
    </label>
  );
}

function ImagePicker({
  preview,
  fileName,
  onPick,
  onClear,
}: {
  preview: string | null;
  fileName?: string | null;
  onPick: (file: File) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <span className="block text-sm" style={{ color: T.muted }}>Ảnh đại diện</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-40 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed text-center"
        style={{
          borderColor: T.border,
          background: "rgba(200,155,69,0.08)",
          color: T.muted,
        }}
      >
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <Upload className="h-8 w-8" style={{ color: T.primaryDark }} />
            <span className="text-sm">Nhấn để chọn ảnh từ thiết bị</span>
            <span className="text-xs">PNG, JPG, WEBP</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      {(fileName || (preview && onClear)) && (
        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: T.muted }}>
          <span className="truncate">{fileName ? `Đã chọn: ${fileName}` : " "}</span>
          {preview && onClear ? (
            <button type="button" onClick={onClear} className="shrink-0 font-medium" style={{ color: T.danger }}>
              Gỡ ảnh
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
      style={{ background: "rgba(200,155,69,0.12)", color: T.primaryDark }}
    >
      {children}
    </span>
  );
}

function formatWhen(iso: string | null | undefined) {
  if (!hasText(iso)) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
      <p className="text-[11px]" style={{ color: T.muted }}>{label}</p>
      <p className="mt-0.5 text-sm" style={{ color: T.text }}>{value}</p>
    </div>
  );
}

function RouteDetailModal({
  route,
  exhibits,
  exhibitions,
  ageGroups,
  museumId,
  startEditing = false,
  onClose,
  onMutated,
}: {
  route: TourRouteDto;
  exhibits: ExhibitDto[];
  exhibitions: ExhibitionDto[];
  ageGroups: AgeGroupDto[];
  museumId: number;
  startEditing?: boolean;
  onClose: () => void;
  onMutated: () => void;
}) {
  const stops = sortedStops(route);
  const title = routeTitle(route);
  const descriptionText = routeDescription(route);
  const en = route.translations?.find((t) => t.languageCode === "en");
  const editing = startEditing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(route.name);
  const [description, setDescription] = useState(routeDescription(route));
  const [duration, setDuration] = useState(route.estimatedDurationMinutes?.toString() ?? "");
  const [status, setStatus] = useState(route.status);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(route.thumbnailUrl ?? null);
  const [exhibitionId, setExhibitionId] = useState<number | "">(route.exhibitionId ?? "");
  const [ageGroupId, setAgeGroupId] = useState<number | "">(route.ageGroupId ?? "");
  const [isDefault, setIsDefault] = useState(route.isDefault);
  const [exhibitId, setExhibitId] = useState<number | "">("");
  const [stopMinutes, setStopMinutes] = useState("");
  const [stopQuery, setStopQuery] = useState("");
  const { success, showSuccess } = useSuccessToast();

  // Form fields init from route on mount (modal remounts via key when id/mode changes).
  // Do not re-sync on every route refresh — stop add/reorder would wipe unsaved edits.

  function pickThumb(file: File) {
    if (!isImageFile(file)) {
      setError("Chọn file ảnh (PNG, JPG, WEBP).");
      return;
    }
    setError(null);
    setThumbFile(file);
    setThumbPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function clearThumb() {
    setThumbFile(null);
    setThumbPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const used = new Set(stops.map((s) => s.exhibitId));
  const available = exhibits.filter((e) => {
    if (used.has(e.id)) return false;
    const q = stopQuery.trim().toLowerCase();
    if (!q) return true;
    return exhibitTitle(e).toLowerCase().includes(q);
  });

  async function saveEdit() {
    setSaving(true);
    setError(null);
    try {
      let nextThumb = thumbFile ? undefined : thumbPreview;
      let alreadyPersistedThumb = false;
      if (thumbFile) {
        nextThumb = await attachRouteThumbnail(
          route.id,
          thumbFile,
          stops[0]?.exhibitId ?? exhibits[0]?.id,
          museumId,
        );
        alreadyPersistedThumb = true;
      }
      await updateRouteEntry(route.id, {
        name: name.trim() || null,
        description: description.trim() || null,
        estimatedDurationMinutes: duration ? Number(duration) : undefined,
        status: status || undefined,
        ...(alreadyPersistedThumb ? {} : { thumbnailUrl: nextThumb || "" }),
        exhibitionId: exhibitionId ? Number(exhibitionId) : null,
        ageGroupId: ageGroupId ? Number(ageGroupId) : null,
        isDefault,
      });
      showSuccess("Đã cập nhật lộ trình.");
      onMutated();
    } catch (err) {
      setError(getDisplayError(err, "Không thể cập nhật lộ trình."));
    } finally {
      setSaving(false);
    }
  }

  async function addStop() {
    if (!exhibitId) return;
    setSaving(true);
    setError(null);
    try {
      await addRouteStop(route.id, {
        exhibitId: Number(exhibitId),
        stopOrder: stops.length + 1,
        estimatedMinutes: stopMinutes ? Number(stopMinutes) : undefined,
      });
      setExhibitId("");
      setStopMinutes("");
      showSuccess("Đã thêm điểm dừng.");
      onMutated();
    } catch (err) {
      setError(getDisplayError(err, "Không thể thêm điểm dừng."));
    } finally {
      setSaving(false);
    }
  }

  async function removeStop(id: number) {
    setSaving(true);
    setError(null);
    try {
      await removeRouteStop(route.id, id);
      showSuccess("Đã gỡ điểm dừng.");
      onMutated();
    } catch (err) {
      setError(getDisplayError(err, "Không thể gỡ điểm dừng."));
    } finally {
      setSaving(false);
    }
  }

  async function moveStop(index: number, dir: -1 | 1) {
    const current = stops.map((s) => s.exhibitId);
    const ids = moveIds(current, index, dir);
    if (ids === current) return;
    setSaving(true);
    setError(null);
    try {
      await reorderStops(route.id, ids);
      onMutated();
    } catch (err) {
      setError(getDisplayError(err, "Không thể đổi thứ tự."));
    } finally {
      setSaving(false);
    }
  }

  async function removeRoute() {
    if (!confirm("Xóa lộ trình này?")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteRouteEntry(route.id);
      onClose();
      onMutated();
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa lộ trình."));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {!editing && hasText(route.thumbnailUrl) && (
          <div className="h-32 shrink-0 overflow-hidden">
            <img src={route.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          {editing ? (
            <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.primaryDark }}>
              Cập nhật lộ trình
            </h3>
          ) : (
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {hasText(route.status) && <StatusBadge status={route.status} />}
              {route.isDefault && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: T.success }}>
                  <Check className="h-3 w-3" /> Mặc định
                </span>
              )}
            </div>
            {hasText(title) && (
              <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.primaryDark }}>
                {title}
              </h3>
            )}
          </div>
          )}
          <button type="button" onClick={onClose} className="rounded-full p-2" style={{ color: T.muted }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden"
          style={hideYScroll}
        >
          {!editing ? (
            <div className="space-y-4">
              {hasText(descriptionText) && (
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
                  {descriptionText}
                </p>
              )}
              {hasText(en?.routeName) && en.routeName.trim() !== title && (
                <p className="text-xs" style={{ color: T.mutedLight }}>
                  EN · {en.routeName}
                </p>
              )}
              {hasText(en?.description) && en.description.trim() !== (descriptionText || "") && (
                <p className="text-xs leading-relaxed" style={{ color: T.mutedLight }}>
                  EN · {en.description}
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {hasNum(route.estimatedDurationMinutes) && (
                  <InfoRow label="Thời lượng" value={`${route.estimatedDurationMinutes} phút`} />
                )}
                {hasText(route.ageGroupName) && (
                  <InfoRow label="Nhóm tuổi" value={route.ageGroupName} />
                )}
                {hasText(route.exhibitionName) && (
                  <InfoRow label="Triển lãm" value={route.exhibitionName} />
                )}
                <InfoRow label="Điểm dừng" value={String(stops.length)} />
                {hasText(formatWhen(route.createdAt)) && (
                  <InfoRow label="Ngày tạo" value={formatWhen(route.createdAt)} />
                )}
                {hasText(formatWhen(route.updatedAt)) && (
                  <InfoRow label="Cập nhật lúc" value={formatWhen(route.updatedAt)} />
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tên">
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle} />
              </Field>
              <Field label="Thời lượng (phút)">
                <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Mô tả">
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <ImagePicker
                  preview={thumbPreview}
                  fileName={thumbFile?.name}
                  onPick={pickThumb}
                  onClear={clearThumb}
                />
              </div>
              <Field label="Trạng thái">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle}>
                  <option value="Active">{labelStatus("Active")}</option>
                  <option value="Draft">{labelStatus("Draft")}</option>
                  <option value="Inactive">{labelStatus("Inactive")}</option>
                </select>
              </Field>
              <Field label="Triển lãm">
                <select value={exhibitionId} onChange={(e) => setExhibitionId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle}>
                  <option value="" />
                  {exhibitions.map((ex) => (
                    <option key={`ex-${ex.id}`} value={ex.id}>{ex.name || "Triển lãm"}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nhóm tuổi">
                <select value={ageGroupId} onChange={(e) => setAgeGroupId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle}>
                  <option value="" />
                  {ageGroups.map((ag) => (
                    <option key={`ag-${ag.id}`} value={ag.id}>{ag.groupName}</option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm" style={{ color: T.text }}>
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} style={{ accentColor: T.primary }} />
                Lộ trình mặc định
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" onClick={saveEdit} disabled={saving} className="rounded-xl px-4 py-2 text-sm disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
                  Hủy
                </button>
              </div>
            </div>
          )}

          <h4 className="mb-3 mt-5 text-sm font-semibold" style={{ color: T.text }}>
            Hành trình
          </h4>

          {stops.length === 0 ? (
            <p className="mb-4 text-sm" style={{ color: T.muted }}>Chưa có điểm dừng.</p>
          ) : (
            <ol className="mb-4 space-y-2">
              {stops.map((stop, index) => {
                const place = stopPlace(stop);
                const nameOfStop = stopTitle(stop);
                const exhibit = exhibits.find((e) => e.id === stop.exhibitId);
                const stopThumb = exhibit?.thumbnailUrl;
                return (
                  <li
                    key={`stop-${route.id}-${stop.exhibitId}-${stop.stopOrder}-${index}`}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                    style={{ border: `1px solid ${T.border}` }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: T.primary, color: T.surface }}
                    >
                      {hasNum(stop.stopOrder) ? stop.stopOrder : index + 1}
                    </span>
                    {hasText(stopThumb) ? (
                      <img src={stopThumb} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {hasText(nameOfStop) && (
                        <p className="truncate text-sm font-medium" style={{ color: T.text }}>
                          {nameOfStop}
                        </p>
                      )}
                      {(hasText(place) || hasNum(stop.estimatedMinutes) || hasText(stop.exhibitCode)) && (
                        <p className="truncate text-[11px]" style={{ color: T.muted }}>
                          {[
                            hasText(stop.exhibitCode) ? stop.exhibitCode : "",
                            place,
                            hasNum(stop.estimatedMinutes) ? `${stop.estimatedMinutes} phút` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    {editing && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" disabled={saving || index <= 0} onClick={() => moveStop(index, -1)} className="rounded p-1 disabled:opacity-30" style={{ color: T.primaryDark }}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" disabled={saving || index >= stops.length - 1} onClick={() => moveStop(index, 1)} className="rounded p-1 disabled:opacity-30" style={{ color: T.primaryDark }}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" disabled={saving} onClick={() => removeStop(stop.exhibitId)} className="rounded p-1" style={{ color: T.danger }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {editing && (
          <div className="space-y-2 rounded-2xl p-3" style={{ background: "rgba(200,155,69,0.05)", border: `1px solid ${T.border}` }}>
            <p className="text-xs font-medium" style={{ color: T.muted }}>Thêm điểm dừng</p>
            <input value={stopQuery} onChange={(e) => setStopQuery(e.target.value)} placeholder="Tìm hiện vật…" className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle} />
            <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
              <select value={exhibitId} onChange={(e) => setExhibitId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="">Chọn hiện vật</option>
                {available.map((e) => (
                  <option key={`avail-${e.id}`} value={e.id}>
                    {exhibitTitle(e)}
                  </option>
                ))}
              </select>
              <input type="number" min="1" value={stopMinutes} onChange={(e) => setStopMinutes(e.target.value)} placeholder="Phút" className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={fieldStyle} />
              <button type="button" onClick={addStop} disabled={saving || !exhibitId} className="rounded-xl px-4 py-2 text-sm disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
                Thêm
              </button>
            </div>
          </div>
          )}

          <div className="mt-3 space-y-2">
            <SuccessBanner message={success} />
            {error && <p className="text-sm" style={{ color: T.danger }}>{error}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t px-6 py-4" style={{ borderColor: T.border }}>
          {editing ? (
            <button type="button" onClick={removeRoute} disabled={saving} className="text-xs font-medium" style={{ color: T.danger }}>
              Xóa lộ trình
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-2 text-sm" style={{ background: T.primary, color: T.surface }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function TourRoutesSection({
  routes,
  exhibits,
  exhibitions,
  ageGroups,
  museumId,
}: {
  routes: TourRouteDto[];
  exhibits: ExhibitDto[];
  exhibitions: ExhibitionDto[];
  ageGroups: AgeGroupDto[];
  museumId: number;
}) {
  const router = useRouter();
  const { success, showSuccess } = useSuccessToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<TourRouteDto | null>(null);
  const [selectedEditing, setSelectedEditing] = useState(false);
  const openRouteSeq = useRef(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [exhibitionId, setExhibitionId] = useState<number | "">("");
  const [ageGroupId, setAgeGroupId] = useState<number | "">("");
  const [isDefault, setIsDefault] = useState(false);
  const [stopIds, setStopIds] = useState<number[]>([]);
  const [stopQuery, setStopQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routes.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${routeTitle(r)} ${routeDescription(r)} ${r.exhibitionName ?? ""} ${r.ageGroupName ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [routes, query, statusFilter]);

  const pickerExhibits = useMemo(() => {
    const q = stopQuery.trim().toLowerCase();
    return exhibits
      .filter((ex) => {
        if (!q) return true;
        const place = exhibitPlace(ex);
        return `${exhibitTitle(ex)} ${ex.exhibitCode ?? ""} ${place}`.toLowerCase().includes(q);
      })
      .sort((a, b) => exhibitTitle(a).localeCompare(exhibitTitle(b), "vi"));
  }, [exhibits, stopQuery]);

  function resetForm() {
    setName("");
    setDescription("");
    setMinutes("");
    setThumbFile(null);
    setThumbPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setExhibitionId("");
    setAgeGroupId("");
    setIsDefault(false);
    setStopIds([]);
    setStopQuery("");
    setError(null);
  }

  function pickCreateThumb(file: File) {
    if (!isImageFile(file)) {
      setError("Chọn file ảnh (PNG, JPG, WEBP).");
      return;
    }
    setError(null);
    setThumbFile(file);
    setThumbPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function clearCreateThumb() {
    setThumbFile(null);
    setThumbPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function openRoute(item: TourRouteDto, editing = false) {
    const seq = ++openRouteSeq.current;
    setSelectedEditing(editing);
    setSelected(item);
    const detail = await getRouteDetail(item.id).catch(() => null);
    if (seq !== openRouteSeq.current) return;
    setSelected(detail ?? item);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nhập tên lộ trình.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let thumbnailUrl: string | undefined;
      if (thumbFile) {
        thumbnailUrl = await hostRouteThumbnail(thumbFile, stopIds[0] ?? exhibits[0]?.id, museumId);
      }
      await createRouteEntry({
        museumId,
        name: name.trim(),
        estimatedDurationMinutes: minutes ? Number(minutes) : undefined,
        thumbnailUrl,
        exhibitionId: exhibitionId ? Number(exhibitionId) : undefined,
        ageGroupId: ageGroupId ? Number(ageGroupId) : undefined,
        isDefault,
        stops: stopIds.map((id, idx) => ({ exhibitId: id, stopOrder: idx + 1 })),
        translations: [
          { languageCode: "vi", routeName: name.trim(), description: description.trim() || undefined },
        ],
      });
      resetForm();
      setShowForm(false);
      showSuccess("Đã tạo lộ trình.");
      router.refresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể tạo lộ trình."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>{routes.length}</span>
          {` lộ trình`}
        </p>
        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm();
            setShowForm((v) => !v);
          }}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Đóng" : "Thêm lộ trình"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex min-w-56 flex-1 items-center gap-2 rounded-2xl px-3 py-2.5"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <Search className="h-4 w-4" style={{ color: T.mutedLight }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên, mô tả, triển lãm…"
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: T.text }}
          />
        </div>
        {(["all", "Active", "Draft", "Inactive"] as const).map((id) => (
          <button
            key={`filter-${id}`}
            type="button"
            onClick={() => setStatusFilter(id)}
            className="rounded-2xl px-3 py-2 text-xs font-medium"
            style={{
              background: statusFilter === id ? T.primary : T.surface,
              color: statusFilter === id ? T.surface : T.muted,
              border: `1px solid ${statusFilter === id ? T.primary : T.border}`,
            }}
          >
            {id === "all" ? "Tất cả" : labelStatus(id)}
          </button>
        ))}
      </div>

      <SuccessBanner message={success} />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-5 rounded-3xl p-6"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <ImagePicker
              preview={thumbPreview}
              fileName={thumbFile?.name}
              onPick={pickCreateThumb}
              onClear={thumbPreview ? clearCreateThumb : undefined}
            />
            <div className="space-y-4">
              <h3 className={dashboardTitleClass} style={{ color: T.text }}>Thông tin lộ trình</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Tên *">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="vd. Lộ trình khảo cổ"
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={fieldStyle}
                    />
                  </Field>
                </div>
                <Field label="Thời lượng (phút)">
                  <input
                    type="number"
                    min="1"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Nhóm tuổi">
                  <select
                    value={ageGroupId}
                    onChange={(e) => setAgeGroupId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={fieldStyle}
                  >
                    <option value="">Không chọn</option>
                    {ageGroups.map((ag) => (
                      <option key={`create-ag-${ag.id}`} value={ag.id}>{ag.groupName}</option>
                    ))}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Mô tả">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Mô tả ngắn về hành trình..."
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={fieldStyle}
                    />
                  </Field>
                </div>
                <Field label="Triển lãm">
                  <select
                    value={exhibitionId}
                    onChange={(e) => setExhibitionId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={fieldStyle}
                  >
                    <option value="">Không chọn</option>
                    {exhibitions.map((ex) => (
                      <option key={`create-ex-${ex.id}`} value={ex.id}>{ex.name || "Triển lãm"}</option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-end gap-2 pb-2 text-sm" style={{ color: T.muted }}>
                  <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} style={{ accentColor: T.primary }} />
                  Lộ trình mặc định
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={dashboardTitleClass} style={{ color: T.text }}>
              Điểm dừng ({stopIds.length})
            </h3>
            {stopIds.length > 0 && (
              <ol className="space-y-1.5">
                {stopIds.map((id, idx) => {
                  const ex = exhibits.find((e) => e.id === id);
                  const place = ex ? exhibitPlace(ex) : "";
                  return (
                    <li key={`picked-${id}`} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ border: `1px solid ${T.border}`, background: T.bg }}>
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: T.primary, color: T.surface }}
                      >
                        {idx + 1}
                      </span>
                      {ex && hasText(ex.thumbnailUrl) ? (
                        <img src={ex.thumbnailUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium" style={{ color: T.text }}>
                          {ex ? exhibitTitle(ex) : "Hiện vật"}
                        </span>
                        {hasText(place) && (
                          <span className="block truncate text-[11px]" style={{ color: T.muted }}>{place}</span>
                        )}
                      </span>
                      <button type="button" onClick={() => setStopIds((ids) => moveIds(ids, idx, -1))} disabled={idx === 0} className="disabled:opacity-30">
                        <ArrowUp className="h-3.5 w-3.5" style={{ color: T.primaryDark }} />
                      </button>
                      <button type="button" onClick={() => setStopIds((ids) => moveIds(ids, idx, 1))} disabled={idx === stopIds.length - 1} className="disabled:opacity-30">
                        <ArrowDown className="h-3.5 w-3.5" style={{ color: T.primaryDark }} />
                      </button>
                      <button type="button" onClick={() => setStopIds((ids) => ids.filter((x) => x !== id))}>
                        <X className="h-3.5 w-3.5" style={{ color: T.danger }} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: T.bg, border: `1px solid ${T.border}` }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: T.mutedLight }} />
              <input
                value={stopQuery}
                onChange={(e) => setStopQuery(e.target.value)}
                placeholder="Tìm hiện vật để thêm điểm dừng…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: T.text }}
              />
            </div>
            <div
              className="max-h-72 space-y-1.5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden"
              style={hideYScroll}
            >
              {pickerExhibits.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs" style={{ color: T.muted }}>
                  {exhibits.length === 0 ? "Chưa có hiện vật." : "Không khớp từ khóa."}
                </p>
              ) : (
                pickerExhibits.map((ex) => {
                  const on = stopIds.includes(ex.id);
                  const place = exhibitPlace(ex);
                  return (
                    <button
                      key={`pick-${ex.id}`}
                      type="button"
                      onClick={() =>
                        setStopIds((prev) => (on ? prev.filter((id) => id !== ex.id) : [...prev, ex.id]))
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left"
                      style={{
                        border: `1px solid ${on ? T.primary : T.border}`,
                        background: on ? "rgba(200,155,69,0.16)" : T.bg,
                      }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          background: on ? T.primary : "rgba(200,155,69,0.16)",
                          color: on ? T.surface : T.primaryDark,
                        }}
                      >
                        {on ? stopIds.indexOf(ex.id) + 1 : "+"}
                      </span>
                      {hasText(ex.thumbnailUrl) ? (
                        <img src={ex.thumbnailUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px]"
                          style={{ background: "rgba(200,155,69,0.10)", color: T.muted }}
                        >
                          HV
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium" style={{ color: T.text }}>
                          {exhibitTitle(ex)}
                        </span>
                        {hasText(place) && (
                          <span className="block truncate text-[11px]" style={{ color: T.muted }}>{place}</span>
                        )}
                      </span>
                      {on && <Check className="h-4 w-4 shrink-0" style={{ color: T.primaryDark }} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: T.danger }}>{error}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="rounded-xl px-5 py-2 text-sm disabled:opacity-50" style={{ background: T.primary, color: T.surface }}>
              {submitting ? "Đang lưu…" : "Lưu lộ trình"}
            </button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl px-8 py-16 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <Route className="mx-auto h-10 w-10" style={{ color: T.mutedLight }} />
          <p className="mt-4 text-sm" style={{ color: T.muted }}>
            {routes.length === 0 ? "Chưa có lộ trình." : "Không khớp bộ lọc."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const stops = sortedStops(item);
            const title = routeTitle(item);
            const desc = routeDescription(item);
            return (
              <article
                key={`route-${item.id}`}
                className="flex flex-col overflow-hidden rounded-3xl"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                {hasText(item.thumbnailUrl) && (
                  <button type="button" onClick={() => openRoute(item)} className="block h-36 overflow-hidden">
                    <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {hasText(item.status) && <StatusBadge status={item.status} />}
                    {item.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: T.success }}>
                        <Check className="h-3 w-3" /> Mặc định
                      </span>
                    )}
                  </div>
                  {hasText(title) && (
                    <button type="button" onClick={() => openRoute(item)} className="text-left font-medium hover:underline" style={{ color: T.text }}>
                      {title}
                    </button>
                  )}
                  {hasText(desc) && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: T.muted }}>{desc}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasNum(item.estimatedDurationMinutes) && (
                      <Chip>
                        <Clock className="h-3 w-3" />
                        {item.estimatedDurationMinutes} phút
                      </Chip>
                    )}
                    {hasText(item.ageGroupName) && <Chip>{item.ageGroupName}</Chip>}
                    {hasText(item.exhibitionName) && <Chip>{item.exhibitionName}</Chip>}
                    <Chip>{stops.length} điểm dừng</Chip>
                  </div>
                  {stops.length > 0 && (
                    <div className="mt-3 flex items-center gap-1 overflow-hidden">
                      {stops.slice(0, 5).map((stop, i) => (
                        <div key={`route-${item.id}-dot-${stop.exhibitId}-${i}`} className="flex items-center gap-1">
                          {i > 0 && <div className="h-px w-3" style={{ background: T.border }} />}
                          <span
                            className="flex h-6 min-w-6 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: "rgba(200,155,69,0.16)", color: T.primaryDark }}
                            title={stopTitle(stop)}
                          >
                            {i + 1}
                          </span>
                        </div>
                      ))}
                      {stops.length > 5 && (
                        <span className="ml-1 text-[11px]" style={{ color: T.muted }}>+{stops.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openRoute(item, false)}
                      className="flex-1 rounded-xl px-3 py-2 text-xs font-medium"
                      style={{ border: `1px solid ${T.border}`, color: T.muted }}
                    >
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => openRoute(item, true)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                      style={{ background: T.primary, color: T.surface }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Cập nhật
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <RouteDetailModal
          key={`${selected.id}-${selectedEditing ? "edit" : "view"}`}
          route={selected}
          exhibits={exhibits}
          exhibitions={exhibitions}
          ageGroups={ageGroups}
          museumId={museumId}
          startEditing={selectedEditing}
          onClose={() => {
            setSelected(null);
            setSelectedEditing(false);
          }}
          onMutated={async () => {
            const detail = await getRouteDetail(selected.id).catch(() => null);
            if (detail) setSelected(detail);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
