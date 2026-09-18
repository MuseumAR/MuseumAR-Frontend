"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Edit3,
  ExternalLink,
  Footprints,
  GripVertical,
  Info,
  Map,
  MapPin,
  Navigation,
  Plus,
  Route,
  Smartphone,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { labelStatus } from "@/lib/status-labels";
import {
  addRouteStop,
  createMapWithImage,
  createRouteEntry,
  deleteRouteEntry,
  removeRouteStop,
  updateRouteEntry,
} from "@/services/content-manager/maps-routes.service";
import { createRoom, deleteRoom, updateRoom } from "@/services/content-manager/room.service";
import { updateMuseumMap, deleteMuseumMap } from "@/services/content-manager/content-api.service";
import { NavigationGraphEditor } from "@/components/content-manager/navigation-graph-editor";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import type {
  AgeGroupDto,
  ExhibitDto,
  ExhibitionDto,
  MuseumMapDto,
  RoomDto,
  TourRouteDto,
  TourRouteStopDto,
} from "@/types/api";

type Tab = "maps" | "rooms" | "routes" | "graph";

/* ═══════════════════════════════════════════════════════════════════════════════
   MAP HELPERS (unchanged)
   ═══════════════════════════════════════════════════════════════════════════════ */

function getMapDisplayName(item: MuseumMapDto): string {
  if (item.mapName?.trim()) return item.mapName.trim();
  const type = item.mapType?.trim() ?? "";
  // BE DTO puts MapName into MapType for seeded maps
  if (type && type !== "floor" && type !== "overview") return type;
  if (type === "overview" || item.floorNumber === 0) return "Tổng quan";
  if (item.floorNumber === -1) return "Tầng hầm B1";
  if (item.floorNumber != null && item.floorNumber > 0) return `Tầng ${item.floorNumber}`;
  return type === "overview" ? "Tổng quan" : "Sơ đồ tầng";
}

function mapKind(item: MuseumMapDto): "overview" | "floor" {
  const type = item.mapType?.trim().toLowerCase() ?? "";
  if (type === "overview" || item.floorNumber === 0) return "overview";
  return "floor";
}

function MapTypeBadge({ kind }: { kind: "overview" | "floor" }) {
  const overview = kind === "overview";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
      style={{
        background: overview ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.15)",
        color: overview ? T.success : T.primaryDark,
      }}
    >
      {kind === "overview" ? "Tổng quan" : "Sơ đồ tầng"}
    </span>
  );
}

function MapPreview({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(!url);

  if (!url || failed) {
    return (
      <div
        className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl px-4 text-center"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Map className="h-8 w-8" style={{ color: T.mutedLight }} />
        <p className="text-xs" style={{ color: T.muted }}>
          Không xem trước được
        </p>
        <p className="line-clamp-2 text-[11px]" style={{ color: T.mutedLight }}>
          {title}
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-36 overflow-hidden rounded-2xl"
      style={{ border: `1px solid ${T.border}`, background: T.bg }}
    >
      <img
        src={url}
        alt={title}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ROUTE HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const isActive = s === "active" || s === "published";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: isActive ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.12)",
        color: isActive ? T.success : T.muted,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: isActive ? T.success : T.mutedLight }}
      />
      {labelStatus(status || "Active")}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOBILE ROUTE GUIDE MODAL (INTERACTIVE MAP WITH DIRECTIONAL ARROWS)
   ═══════════════════════════════════════════════════════════════════════════════ */

function MobileRouteGuideModal({
  route,
  onClose,
}: {
  route: TourRouteDto;
  onClose: () => void;
}) {
  const sortedStops = useMemo(
    () => [...(route.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder),
    [route.stops],
  );

  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);

  const currentStop = sortedStops[currentStopIndex] as TourRouteStopDto | undefined;
  const nextStop = sortedStops[(currentStopIndex + 1) % (sortedStops.length || 1)] as TourRouteStopDto | undefined;

  function handleNextStop() {
    if (sortedStops.length === 0) return;
    setCurrentStopIndex((prev) => (prev + 1) % sortedStops.length);
  }

  function handlePrevStop() {
    if (sortedStops.length === 0) return;
    setCurrentStopIndex((prev) => (prev - 1 + sortedStops.length) % sortedStops.length);
  }

  // Current room & floor details
  const currentRoomName = currentStop
    ? [currentStop.roomCode, currentStop.roomName].filter(Boolean).join(" - ") || `Phòng chưa đặt tên`
    : "Chưa chọn điểm dừng";

  const currentFloorText = currentStop?.floorNumber != null ? `Tầng ${currentStop.floorNumber}` : "Chưa gán tầng";

  const nextRoomName = nextStop
    ? [nextStop.roomCode, nextStop.roomName].filter(Boolean).join(" - ") || `Phòng chưa đặt tên`
    : "Chưa chọn điểm dừng";

  const isFloorChange =
    currentStop?.floorNumber != null &&
    nextStop?.floorNumber != null &&
    currentStop.floorNumber !== nextStop.floorNumber;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[40px] p-4 shadow-2xl overflow-hidden border-4 border-neutral-700 bg-neutral-900 text-white"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "sans-serif" }}
      >
        {/* Mobile top status bar */}
        <div className="flex items-center justify-between px-4 pt-1 pb-2 text-[11px] font-semibold text-neutral-400">
          <span>09:41</span>
          <div className="h-4 w-28 rounded-full bg-neutral-800 flex items-center justify-center">
            <div className="h-1.5 w-10 rounded-full bg-neutral-700" />
          </div>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300 leading-tight">Bản đồ lộ trình</p>
              <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">{route.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Banner Vị trí hiện tại & Điểm đến kế tiếp */}
        <div className="m-3 p-3 rounded-2xl bg-gradient-to-r from-neutral-800 to-neutral-850 border border-neutral-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold truncate max-w-[48%]">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="truncate">Đang ở: {currentRoomName}</span>
            </div>
            <span className="text-neutral-500 shrink-0">➔</span>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold truncate max-w-[48%]">
              <Target className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Điểm đến: {nextRoomName}</span>
            </div>
          </div>

          {/* Turn-by-turn Guidance Banner */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <Compass className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[11px] leading-tight text-amber-200">
              <p className="font-bold">Hướng dẫn:</p>
              <p className="mt-0.5 font-medium">
                {isFloorChange
                  ? `🚶‍♂️ Đi cầu thang/thang máy từ ${currentFloorText} ➔ Tầng ${nextStop?.floorNumber} đến ${nextRoomName}`
                  : `➡️ Đi theo hành lang đến ${nextRoomName} để xem ${nextStop?.exhibitName || "hiện vật tiếp theo"}`}
              </p>
            </div>
          </div>
        </div>

        {/* Floor plan Map Canvas */}
        <div className="mx-3 rounded-2xl p-3 bg-neutral-950 border border-neutral-800 relative">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-300 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" /> SƠ ĐỒ {currentFloorText.toUpperCase()}
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Dẫn đường trực tiếp 📍
            </span>
          </div>

          {/* Dynamic Stops Grid */}
          {sortedStops.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Lộ trình chưa có điểm dừng hiện vật.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {sortedStops.map((stop, idx) => {
                const isCurrent = idx === currentStopIndex;
                const isNext = idx === (currentStopIndex + 1) % sortedStops.length;
                const roomStr = [stop.roomCode, stop.roomName].filter(Boolean).join(" - ") || `Chưa gán phòng`;
                const floorStr = stop.floorNumber != null ? `Tầng ${stop.floorNumber}` : "";

                return (
                  <div
                    key={stop.exhibitId}
                    onClick={() => setCurrentStopIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isCurrent
                        ? "bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-950"
                        : isNext
                        ? "bg-amber-950/60 border-amber-500/80"
                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCurrent ? "bg-emerald-500 text-black" : isNext ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-400"
                      }`}>
                        {isCurrent ? "Bạn đang ở đây" : isNext ? "Tiếp" : `Điểm #${stop.stopOrder}`}
                      </span>
                      {floorStr && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {floorStr}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">
                      {stop.exhibitName || `Hiện vật #${stop.exhibitId}`}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      🚪 {roomStr}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step navigation bar (Previous / Next Stop) */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStop}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Điểm trước
          </button>

          <span className="text-xs text-neutral-400 font-medium">
            Điểm {sortedStops.length > 0 ? `${currentStopIndex + 1}/${sortedStops.length}` : "1/2"}
          </span>

          <button
            type="button"
            onClick={handleNextStop}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1"
          >
            Điểm tiếp <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ROUTE DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════════════ */

function RouteDetailModal({
  route,
  exhibits,
  onClose,
  onRefresh,
  onOpenMobileSimulator,
}: {
  route: TourRouteDto;
  exhibits: ExhibitDto[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenMobileSimulator?: () => void;
}) {
  const [addingStop, setAddingStop] = useState(false);
  const [selectedExhibitId, setSelectedExhibitId] = useState<number | "">("");
  const [stopMinutes, setStopMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(route.name);
  const [editDesc, setEditDesc] = useState(route.description ?? "");
  const [editDuration, setEditDuration] = useState(
    route.estimatedDurationMinutes?.toString() ?? "",
  );
  const [editStatus, setEditStatus] = useState(route.status);
  const router = useRouter();
  const { success, showSuccess } = useSuccessToast();

  // Exhibits not already in stops
  const usedExhibitIds = new Set(route.stops.map((s) => s.exhibitId));
  const availableExhibits = exhibits.filter((e) => !usedExhibitIds.has(e.id));

  const sortedStops = [...route.stops].sort((a, b) => a.stopOrder - b.stopOrder);

  async function handleAddStop() {
    if (!selectedExhibitId) return;
    setSaving(true);
    setError(null);
    try {
      await addRouteStop(route.id, {
        exhibitId: Number(selectedExhibitId),
        stopOrder: route.stops.length + 1,
        estimatedMinutes: stopMinutes ? Number(stopMinutes) : undefined,
      });
      setSelectedExhibitId("");
      setStopMinutes("");
      setAddingStop(false);
      showSuccess("Đã thêm điểm dừng.");
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể thêm điểm dừng."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveStop(exhibitId: number) {
    setSaving(true);
    setError(null);
    try {
      await removeRouteStop(route.id, exhibitId);
      showSuccess("Đã gỡ điểm dừng.");
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể gỡ điểm dừng."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRoute() {
    setSaving(true);
    setError(null);
    try {
      await deleteRouteEntry(route.id);
      onClose();
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa lộ trình."));
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    setSaving(true);
    setError(null);
    try {
      await updateRouteEntry(route.id, {
        name: editName.trim() || null,
        description: editDesc.trim() || null,
        estimatedDurationMinutes: editDuration ? Number(editDuration) : undefined,
        status: editStatus || undefined,
      });
      setEditing(false);
      showSuccess("Đã cập nhật lộ trình.");
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Không thể cập nhật lộ trình."));
    } finally {
      setSaving(false);
    }
  }

  function getExhibitDisplayName(exhibit: ExhibitDto): string {
    const vi = exhibit.translations?.find((t) => t.languageCode === "vi");
    const any = exhibit.translations?.[0];
    return vi?.title || any?.title || exhibit.exhibitCode || `Hiện vật #${exhibit.id}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-lg font-bold outline-none"
                style={{
                  border: `1px solid ${T.border}`,
                  background: T.bg,
                  color: T.text,
                  fontFamily: cinzel,
                }}
              />
            ) : (
              <h3
                className={dashboardTitleClass}
                style={{ fontFamily: cinzel, color: T.primaryDark }}
              >
                {route.name}
              </h3>
            )}
            <p className="text-xs mt-1" style={{ color: T.mutedLight }}>
              Mã lộ trình: {route.id}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenMobileSimulator && (
              <button
                type="button"
                onClick={onOpenMobileSimulator}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                  color: T.surface,
                }}
              >
                <Smartphone className="h-3.5 w-3.5" /> Bản đồ di động 📱
              </button>
            )}
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl p-2 hover:bg-[rgba(200,155,69,0.1)] transition-colors"
                style={{ color: T.primaryDark }}
                title="Sửa lộ trình"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-[rgba(200,155,69,0.15)] transition-colors"
              style={{ color: T.muted }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Route info */}
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl p-4 mb-6"
          style={{ background: "rgba(200,155,69,0.06)", border: `1px solid ${T.border}` }}
        >
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: T.mutedLight }}>Thời lượng</p>
            {editing ? (
              <input
                type="number"
                min="1"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="45"
                className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
              />
            ) : (
              <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: T.text }}>
                <Clock className="h-3.5 w-3.5" style={{ color: T.mutedLight }} />
                {route.estimatedDurationMinutes ? `${route.estimatedDurationMinutes} phút` : "—"}
              </p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: T.mutedLight }}>Trạng thái</p>
            {editing ? (
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
              >
                <option value="Active">{labelStatus("Active")}</option>
                <option value="Draft">{labelStatus("Draft")}</option>
                <option value="Inactive">{labelStatus("Inactive")}</option>
              </select>
            ) : (
              <StatusBadge status={route.status} />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: T.mutedLight }}>Điểm dừng</p>
            <p className="text-sm font-medium" style={{ color: T.text }}>
              {route.stops.length} điểm dừng
            </p>
          </div>
          {route.exhibitionName && (
            <div className="space-y-0.5">
              <p className="text-xs" style={{ color: T.mutedLight }}>Triển lãm</p>
              <p className="text-sm font-medium" style={{ color: T.text }}>
                {route.exhibitionName}
              </p>
            </div>
          )}
          {route.ageGroupName && (
            <div className="space-y-0.5">
              <p className="text-xs" style={{ color: T.mutedLight }}>Nhóm tuổi</p>
              <p className="text-sm font-medium" style={{ color: T.text }}>
                {route.ageGroupName}
              </p>
            </div>
          )}
          {route.isDefault && (
            <div className="space-y-0.5">
              <p className="text-xs" style={{ color: T.mutedLight }}>Mặc định</p>
              <p className="text-sm font-medium flex items-center gap-1" style={{ color: T.success }}>
                <Check className="h-3.5 w-3.5" /> Lộ trình mặc định
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {(route.description || editing) && (
          <div className="mb-6">
            <p className="text-xs mb-1.5 font-medium" style={{ color: T.mutedLight }}>
              Mô tả
            </p>
            {editing ? (
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                placeholder="Mô tả lộ trình tham quan…"
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
                {route.description}
              </p>
            )}
          </div>
        )}

        {/* Edit buttons */}
        {editing && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: T.primary, color: T.surface }}
            >
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditName(route.name);
                setEditDesc(route.description ?? "");
                setEditDuration(route.estimatedDurationMinutes?.toString() ?? "");
                setEditStatus(route.status);
              }}
              className="rounded-xl px-5 py-2 text-sm font-medium"
              style={{ border: `1px solid ${T.border}`, color: T.muted }}
            >
              Hủy
            </button>
          </div>
        )}

        {/* Stops section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: T.text }}>
              Điểm dừng ({sortedStops.length})
            </h4>
            {!addingStop && (
              <button
                type="button"
                onClick={() => setAddingStop(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: "rgba(200,155,69,0.12)",
                  color: T.primaryDark,
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Thêm điểm dừng
              </button>
            )}
          </div>

          {/* Add stop form */}
          {addingStop && (
            <div
              className="rounded-2xl p-4 mb-3"
              style={{ background: "rgba(200,155,69,0.06)", border: `1px solid ${T.border}` }}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs" style={{ color: T.muted }}>Chọn hiện vật *</label>
                  <select
                    value={selectedExhibitId}
                    onChange={(e) => setSelectedExhibitId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                  >
                    <option value="">-- Chọn hiện vật --</option>
                    {availableExhibits.map((e) => (
                      <option key={e.id} value={e.id}>
                        {getExhibitDisplayName(e)} (#{e.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs" style={{ color: T.muted }}>Thời lượng (phút)</label>
                  <input
                    type="number"
                    min="1"
                    value={stopMinutes}
                    onChange={(e) => setStopMinutes(e.target.value)}
                    placeholder="5"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleAddStop}
                  disabled={saving || !selectedExhibitId}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {saving ? "Đang thêm…" : "Thêm"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingStop(false); setSelectedExhibitId(""); setStopMinutes(""); }}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium"
                  style={{ border: `1px solid ${T.border}`, color: T.muted }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Stops list */}
          {sortedStops.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-8 text-center"
              style={{ background: "rgba(200,155,69,0.04)", border: `1px dashed ${T.border}` }}
            >
              <MapPin className="mx-auto h-8 w-8 mb-2" style={{ color: T.mutedLight }} />
              <p className="text-sm" style={{ color: T.muted }}>
                Chưa có điểm dừng. Thêm hiện vật để tạo lộ trình.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedStops.map((stop, idx) => (
                <div
                  key={`${stop.exhibitId}-${idx}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 group transition-colors hover:bg-[rgba(200,155,69,0.04)]"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <div
                    className="flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                      color: T.surface,
                    }}
                  >
                    {stop.stopOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: T.text }}>
                      {stop.exhibitName || `Hiện vật #${stop.exhibitId}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: T.mutedLight }}>
                      {stop.exhibitCode && <span>Mã: {stop.exhibitCode}</span>}
                      {stop.estimatedMinutes != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {stop.estimatedMinutes} phút
                        </span>
                      )}
                      {stop.floorNumber != null && <span>Tầng {stop.floorNumber}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(stop.exhibitId)}
                    disabled={saving}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 transition-all hover:bg-red-50"
                    style={{ color: "#B45309" }}
                    title="Gỡ điểm dừng"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Translations preview */}
        {route.translations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2" style={{ color: T.text }}>
              Bản dịch ({route.translations.length})
            </h4>
            <div className="space-y-2">
              {route.translations.map((t) => (
                <div
                  key={t.languageCode}
                  className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(200,155,69,0.04)", border: `1px solid ${T.border}` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: "rgba(200,155,69,0.15)", color: T.primaryDark }}
                    >
                      {t.languageCode}
                    </span>
                    <span className="text-sm font-medium" style={{ color: T.text }}>
                      {t.routeName}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs leading-relaxed ml-8" style={{ color: T.muted }}>
                      {t.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 space-y-2">
          <SuccessBanner message={success} />
          {error && (
            <p className="text-sm" style={{ color: "#8B2E2E" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: `1px solid ${T.border}` }}
        >
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "#8B2E2E" }}>
                Xóa lộ trình này?
              </span>
              <button
                type="button"
                onClick={handleDeleteRoute}
                disabled={saving}
                className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                style={{ background: "#8B2E2E", color: "#fff" }}
              >
                {saving ? "Đang xóa…" : "Xóa"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: "#8B2E2E" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa lộ trình
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-medium"
            style={{ background: T.primary, color: T.surface }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */

export function MapsRoutesPanel({
  maps,
  routes = [],
  rooms = [],
  museumId,
  exhibitions = [],
  ageGroups = [],
  exhibits = [],
}: {
  maps: MuseumMapDto[];
  routes?: TourRouteDto[];
  rooms?: RoomDto[];
  museumId: number;
  exhibitions?: ExhibitionDto[];
  ageGroups?: AgeGroupDto[];
  exhibits?: ExhibitDto[];
}) {
  const router = useRouter();
  const mapFileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("maps");
  const [showMapForm, setShowMapForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [mapType, setMapType] = useState("floor");
  const [mapName, setMapName] = useState("");
  const [floorNumber, setFloorNumber] = useState("1");
  const [selectedMap, setSelectedMap] = useState<MuseumMapDto | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TourRouteDto | null>(null);
  const [mobileSimRoute, setMobileSimRoute] = useState<TourRouteDto | null>(null);

  // Room form state
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomNameEn, setRoomNameEn] = useState("");
  const [roomMapId, setRoomMapId] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [roomDescEn, setRoomDescEn] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomDto | null>(null);
  const { success, showSuccess } = useSuccessToast();

  // Route form state
  const [routeName, setRouteName] = useState("");
  const [routeDesc, setRouteDesc] = useState("");
  const [routeMinutes, setRouteMinutes] = useState("");
  const [routeExhibitionId, setRouteExhibitionId] = useState<number | "">("");
  const [routeAgeGroupId, setRouteAgeGroupId] = useState<number | "">("");
  const [routeIsDefault, setRouteIsDefault] = useState(false);
  const [selectedExhibitIds, setSelectedExhibitIds] = useState<number[]>([]);

  const [mapError, setMapError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"map" | "route" | "room" | null>(null);

  // Map edit state
  const [editingMap, setEditingMap] = useState<MuseumMapDto | null>(null);
  const [editMapName, setEditMapName] = useState("");
  const [editMapFloor, setEditMapFloor] = useState("1");
  const [editMapFile, setEditMapFile] = useState<File | null>(null);
  const [editMapPreview, setEditMapPreview] = useState<string | null>(null);
  const editMapFileRef = useRef<HTMLInputElement>(null);
  const [deletingMapId, setDeletingMapId] = useState<number | null>(null);

  function openEditMapModal(map: MuseumMapDto) {
    setEditingMap(map);
    setEditMapName(getMapDisplayName(map));
    setEditMapFloor(map.floorNumber != null ? String(map.floorNumber) : "1");
    setEditMapFile(null);
    setEditMapPreview(map.mapImageUrl || null);
    setMapError(null);
  }

  async function handleUpdateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMap) return;
    if (!editMapName.trim()) {
      setMapError("Vui lòng nhập tên bản đồ.");
      return;
    }
    setSubmitting("map");
    setMapError(null);
    try {
      const formData = new FormData();
      // BE now stores MapName and MapType separately — do not put display name in MapType
      formData.append("MapName", editMapName.trim());
      formData.append("MapType", editingMap.mapType?.trim() || "floor");
      formData.append("FloorNumber", editMapFloor);
      if (editMapFile) {
        formData.append("MapImage", editMapFile);
      }
      await updateMuseumMap(editingMap.id, formData);
      setEditingMap(null);
      setEditMapFile(null);
      setEditMapPreview(null);
      showSuccess("Đã cập nhật bản đồ.");
      router.refresh();
    } catch (err) {
      setMapError(getDisplayError(err, "Không thể cập nhật bản đồ."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteMap(id: number) {
    if (!confirm("Xóa sơ đồ tầng này?")) return;
    setDeletingMapId(id);
    setMapError(null);
    try {
      await deleteMuseumMap(id);
      if (selectedMap?.id === id) setSelectedMap(null);
      showSuccess("Đã xóa bản đồ.");
      router.refresh();
    } catch (err) {
      setMapError(getDisplayError(err, "Không thể xóa bản đồ."));
    } finally {
      setDeletingMapId(null);
    }
  }

  function toggleRouteExhibit(id: number) {
    setSelectedExhibitIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!routeName.trim()) {
      setRouteError("Vui lòng nhập tên lộ trình.");
      return;
    }
    setSubmitting("route");
    setRouteError(null);
    try {
      await createRouteEntry({
        museumId,
        name: routeName.trim(),
        estimatedDurationMinutes: routeMinutes ? Number(routeMinutes) : undefined,
        exhibitionId: routeExhibitionId ? Number(routeExhibitionId) : undefined,
        ageGroupId: routeAgeGroupId ? Number(routeAgeGroupId) : undefined,
        isDefault: routeIsDefault,
        stops: selectedExhibitIds.map((exhibitId, idx) => ({
          exhibitId,
          stopOrder: idx + 1,
        })),
        translations: [
          {
            languageCode: "vi",
            routeName: routeName.trim(),
            description: routeDesc.trim() || undefined,
          },
        ],
      });
      resetRouteForm();
      setShowRouteForm(false);
      showSuccess("Đã tạo lộ trình.");
      router.refresh();
    } catch (err) {
      setRouteError(getDisplayError(err, "Không thể tạo lộ trình."));
    } finally {
      setSubmitting(null);
    }
  }

  function resetRouteForm() {
    setRouteName("");
    setRouteDesc("");
    setRouteMinutes("");
    setRouteExhibitionId("");
    setRouteAgeGroupId("");
    setRouteIsDefault(false);
    setSelectedExhibitIds([]);
    setRouteError(null);
  }

  const floorMaps = useMemo(
    () => maps.filter((m) => mapKind(m) === "floor"),
    [maps],
  );

  function resetRoomForm() {
    setEditingRoom(null);
    setRoomCode("");
    setRoomName("");
    setRoomNameEn("");
    setRoomDesc("");
    setRoomDescEn("");
    setRoomMapId("");
    setRoomError(null);
    setShowRoomForm(false);
  }

  function openCreateRoom() {
    if (showRoomForm) {
      resetRoomForm();
      return;
    }
    setEditingRoom(null);
    setRoomError(null);
    setShowRoomForm(true);
  }

  function openEditRoom(room: RoomDto) {
    setEditingRoom(room);
    setRoomCode(room.roomCode);
    setRoomName(room.roomName);
    setRoomNameEn(room.roomNameEn ?? "");
    setRoomMapId(room.mapId ? String(room.mapId) : "");
    setRoomDesc(room.description ?? "");
    setRoomDescEn(room.descriptionEn ?? "");
    setRoomError(null);
    setShowRoomForm(true);
  }

  async function handleSaveRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!roomCode.trim() || !roomName.trim()) {
      setRoomError("Vui lòng nhập mã phòng và tên phòng.");
      return;
    }
    setSubmitting("room");
    setRoomError(null);
    const mapId = roomMapId ? Number(roomMapId) : null;
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          mapId,
          roomCode: roomCode.trim(),
          roomName: roomName.trim(),
          roomNameEn: roomNameEn.trim() || undefined,
          description: roomDesc.trim() || undefined,
          descriptionEn: roomDescEn.trim() || undefined,
        });
        showSuccess("Đã cập nhật phòng.");
      } else {
        await createRoom({
          museumId,
          mapId: mapId ?? undefined,
          roomCode: roomCode.trim(),
          roomName: roomName.trim(),
          roomNameEn: roomNameEn.trim() || undefined,
          description: roomDesc.trim() || undefined,
          descriptionEn: roomDescEn.trim() || undefined,
        });
        showSuccess("Đã tạo phòng.");
      }
      resetRoomForm();
      router.refresh();
    } catch (err) {
      setRoomError(getDisplayError(err, editingRoom ? "Không thể cập nhật phòng." : "Không thể tạo phòng."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteRoom(id: number) {
    setDeletingRoomId(id);
    setRoomError(null);
    try {
      await deleteRoom(id);
      showSuccess("Đã xóa phòng.");
      router.refresh();
    } catch (err) {
      setRoomError(getDisplayError(err, "Không thể xóa phòng."));
    } finally {
      setDeletingRoomId(null);
    }
  }

  async function handleCreateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!mapFile) {
      setMapError("Vui lòng chọn ảnh bản đồ từ thiết bị.");
      return;
    }
    if (!mapName.trim()) {
      setMapError("Vui lòng nhập tên bản đồ.");
      return;
    }
    setSubmitting("map");
    setMapError(null);
    try {
      await createMapWithImage(museumId, mapFile, mapType, mapName.trim(), Number(floorNumber));
      setMapFile(null);
      setMapPreview(null);
      setMapName("");
      setFloorNumber("1");
      setMapType("floor");
      if (mapFileRef.current) mapFileRef.current.value = "";
      setShowMapForm(false);
      showSuccess("Đã tải bản đồ lên.");
      router.refresh();
    } catch (err) {
      setMapError(getDisplayError(err, "Không thể tải bản đồ lên."));
    } finally {
      setSubmitting(null);
    }
  }

  function handleMapFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMapError("Vui lòng chọn tệp ảnh (PNG, JPG, …).");
      return;
    }
    setMapError(null);
    setMapFile(file);
    setMapPreview(URL.createObjectURL(file));
  }

  const tabBtn = (id: Tab, label: string, count: number, Icon: typeof Map) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-opacity"
        style={{
          background: active
            ? `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`
            : T.surface,
          color: active ? T.surface : T.muted,
          border: active ? "none" : `1px solid ${T.border}`,
        }}
      >
        <Icon className="h-4 w-4" />
        {label}
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{
            background: active ? "rgba(255,255,255,0.2)" : "rgba(200,155,69,0.12)",
            color: active ? T.surface : T.primaryDark,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6 px-8 pb-10">
      <div
        className="flex gap-3 rounded-2xl p-4"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.primaryDark }} />
        <div className="space-y-1 text-sm" style={{ color: T.muted }}>
          <p style={{ color: T.text }}>
            <strong>Bản đồ & phòng</strong> quản lý sơ đồ 2D, phòng trưng bày và dẫn đường trong nhà cho ứng dụng di động.
          </p>
          <p>
            <strong>Bản đồ bảo tàng</strong> — ảnh sơ đồ tầng hoặc khu vực.{" "}
            <strong>Phòng trưng bày</strong> — phòng chính thức gắn với sơ đồ tầng.{" "}
            <strong>Đồ thị dẫn đường</strong> — đường đi từ phòng A đến phòng B.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabBtn("maps", "Bản đồ bảo tàng", maps.length, MapPin)}
        {tabBtn("rooms", "Phòng trưng bày", rooms.length, Compass)}
        {tabBtn("graph", "Đồ thị dẫn đường", 1, Navigation)}
      </div>

      <SuccessBanner message={success} />

      {/* ═══ GRAPH TAB ═══ */}
      {tab === "graph" && (
        <NavigationGraphEditor museumId={museumId} maps={maps} rooms={rooms} />
      )}

      {/* ═══ MAPS TAB ═══ */}
      {tab === "maps" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
              <span className="font-semibold" style={{ color: T.text }}>
                {maps.length}
              </span>
              {` bản đồ`}
            </p>
            <button
              type="button"
              onClick={() => setShowMapForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Plus className="h-4 w-4" />
              {showMapForm ? "Đóng" : "Thêm bản đồ"}
            </button>
          </div>

          {showMapForm && (
            <form
              onSubmit={handleCreateMap}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Ảnh bản đồ *
                  </label>
                  <button
                    type="button"
                    onClick={() => mapFileRef.current?.click()}
                    className="flex min-h-[10rem] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed px-4 py-6 text-center"
                    style={{
                      borderColor: T.border,
                      background: "rgba(200,155,69,0.08)",
                      color: T.muted,
                    }}
                  >
                    {mapPreview ? (
                      <img
                        src={mapPreview}
                        alt=""
                        className="max-h-48 w-full object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="h-8 w-8" style={{ color: T.primaryDark }} />
                        <span className="text-sm">Nhấn để chọn ảnh từ thiết bị</span>
                        <span className="text-xs">PNG, JPG, WEBP</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={mapFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMapFileChange}
                  />
                  {mapFile && (
                    <p className="text-xs" style={{ color: T.muted }}>
                      Đã chọn: {mapFile.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Tên bản đồ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd. Bản đồ tầng trệt, Bản đồ tầng 1"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Loại bản đồ
                  </label>
                  <select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="floor">Sơ đồ tầng</option>
                    <option value="overview">Tổng quan</option>
                  </select>
                </div>
                {mapType === "floor" && (
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>
                      Số tầng *
                    </label>
                    <input
                      type="number"
                      required
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>
                )}
              </div>
              {mapError && (
                <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>
                  {mapError}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting === "map"}
                  className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {submitting === "map" ? "Đang tải lên…" : "Tải bản đồ lên"}
                </button>
              </div>
            </form>
          )}

          {maps.length === 0 ? (
            <div
              className="rounded-3xl px-8 py-16 text-center"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <MapPin className="mx-auto h-10 w-10" style={{ color: T.mutedLight }} />
              <p className="mt-4 text-sm" style={{ color: T.muted }}>
                Chưa có bản đồ. Thêm sơ đồ tầng hoặc ảnh tổng quan.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {maps.map((item) => {
                const name = getMapDisplayName(item);
                const kind = mapKind(item);
                return (
                <article
                  key={item.id}
                  className="rounded-3xl p-5 transition-transform hover:scale-[1.01]"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <div onClick={() => setSelectedMap(item)} className="cursor-pointer">
                    <MapPreview url={item.mapImageUrl} title={name} />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <p onClick={() => setSelectedMap(item)} className="font-medium cursor-pointer hover:underline" style={{ color: T.text }}>
                        {name}
                      </p>
                      <p className="text-xs" style={{ color: T.mutedLight }}>
                        Bản đồ #{item.id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MapTypeBadge kind={kind} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditMapModal(item)}
                          className="rounded-lg p-1.5 text-xs font-medium hover:bg-[rgba(200,155,69,0.1)] transition-colors"
                          style={{ color: T.primaryDark }}
                          title="Sửa sơ đồ tầng"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMap(item.id)}
                          disabled={deletingMapId === item.id}
                          className="rounded-lg p-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                          title="Xóa sơ đồ tầng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.mapImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedMap(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{ color: T.primaryDark }}
                        >
                          <Info className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ EDIT MAP MODAL ═══ */}
      {editingMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingMap(null)}
        >
          <form
            onSubmit={handleUpdateMap}
            className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.border }}>
              <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.primaryDark }}>
                Sửa sơ đồ tầng #{editingMap.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMap(null)}
                className="rounded-full p-1.5 hover:bg-neutral-100 text-neutral-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: T.muted }}>
                Tên / loại sơ đồ *
              </label>
              <input
                type="text"
                required
                value={editMapName}
                onChange={(e) => setEditMapName(e.target.value)}
                placeholder="vd. Sơ đồ tầng 1"
                className="w-full rounded-xl px-4 py-2 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: T.muted }}>
                Số tầng *
              </label>
              <input
                type="number"
                required
                value={editMapFloor}
                onChange={(e) => setEditMapFloor(e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: T.muted }}>
                Thay ảnh sơ đồ tầng (tùy chọn)
              </label>
              <div className="flex items-center gap-3">
                {editMapPreview && (
                  <img
                    src={editMapPreview}
                    alt="Xem trước"
                    className="h-16 w-16 object-cover rounded-xl border"
                    style={{ borderColor: T.border }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => editMapFileRef.current?.click()}
                  className="rounded-xl px-4 py-2 text-xs font-semibold border flex items-center gap-1.5"
                  style={{ borderColor: T.border, background: T.bg, color: T.text }}
                >
                  <Upload className="h-3.5 w-3.5" /> Chọn ảnh mới…
                </button>
                <input
                  ref={editMapFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setEditMapFile(f);
                      setEditMapPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>
              {editMapFile && (
                <p className="text-[11px] text-emerald-700 font-medium">Đã chọn: {editMapFile.name}</p>
              )}
            </div>

            {mapError && (
              <p className="text-xs font-medium" style={{ color: "#8B2E2E" }}>
                {mapError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
              <button
                type="button"
                onClick={() => setEditingMap(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting === "map"}
                className="rounded-xl px-5 py-2 text-xs font-medium text-white disabled:opacity-50"
                style={{ background: T.primary }}
              >
                {submitting === "map" ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ ROOMS TAB ═══ */}
      {tab === "rooms" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
              <span className="font-semibold" style={{ color: T.text }}>
                {rooms.length}
              </span>
              {` phòng trưng bày`}
            </p>
            <button
              type="button"
              onClick={openCreateRoom}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Plus className="h-4 w-4" />
              {showRoomForm ? "Đóng" : "Thêm phòng mới"}
            </button>
          </div>

          {showRoomForm && (
            <form
              onSubmit={handleSaveRoom}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <h3 className={`${dashboardTitleClass} mb-4`} style={{ fontFamily: cinzel, color: T.text }}>
                {editingRoom ? "Sửa phòng trưng bày" : "Thêm phòng trưng bày"}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Mã phòng * (vd. P102)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="P102"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Tên (VI) * (vd. Phòng 102 - Văn hóa Đông Sơn)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Phòng 102 - Văn hóa Đông Sơn"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Tên (EN)
                  </label>
                  <input
                    type="text"
                    placeholder="Room 102 - Dong Son Culture"
                    value={roomNameEn}
                    onChange={(e) => setRoomNameEn(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Liên kết sơ đồ tầng (tùy chọn)
                  </label>
                  <select
                    value={roomMapId}
                    onChange={(e) => setRoomMapId(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="">-- Không gắn bản đồ --</option>
                    {floorMaps.map((m) => (
                      <option key={m.id} value={m.id}>
                        Tầng {m.floorNumber} {m.mapName ? `(${m.mapName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Mô tả (VI)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả hiện vật trưng bày trong phòng..."
                    value={roomDesc}
                    onChange={(e) => setRoomDesc(e.target.value)}
                    className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Mô tả (EN)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tiếng Anh (tùy chọn)"
                    value={roomDescEn}
                    onChange={(e) => setRoomDescEn(e.target.value)}
                    className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
              </div>

              {roomError && (
                <p className="mt-3 text-sm font-medium" style={{ color: "#8B2E2E" }}>
                  {roomError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetRoomForm}
                  className="rounded-xl px-5 py-2 text-sm font-medium"
                  style={{ border: `1px solid ${T.border}`, color: T.muted }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting === "room"}
                  className="rounded-xl px-6 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: T.primary }}
                >
                  {submitting === "room"
                    ? editingRoom
                      ? "Đang lưu..."
                      : "Đang tạo..."
                    : editingRoom
                      ? "Lưu phòng"
                      : "Lưu phòng mới"}
                </button>
              </div>
            </form>
          )}

          {rooms.length === 0 ? (
            <div
              className="rounded-3xl p-12 text-center"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <Compass className="mx-auto mb-3 h-10 w-10 opacity-30" style={{ color: T.muted }} />
              <p className="font-semibold" style={{ color: T.text }}>Chưa có phòng trưng bày</p>
              <p className="mt-1 text-sm" style={{ color: T.muted }}>
                Đăng ký phòng chính thức để gán hiện vật và xây dẫn đường trong nhà.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-3xl p-5 transition-shadow hover:shadow-md flex flex-col justify-between"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-full px-3 py-1 font-mono text-xs font-bold" style={{ background: "rgba(200,155,69,0.18)", color: T.primaryDark }}>
                        {room.roomCode}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: T.mutedLight }}>
                        Tầng {room.floorNumber}
                      </span>
                    </div>
                    <h4 className="font-semibold text-base mb-1" style={{ color: T.text }}>
                      {room.roomName}
                    </h4>
                    {room.roomNameEn && (
                      <p className="text-xs mb-1" style={{ color: T.mutedLight }}>
                        {room.roomNameEn}
                      </p>
                    )}
                    {room.description && (
                      <p className="text-xs line-clamp-2" style={{ color: T.muted }}>
                        {room.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs border-t" style={{ borderColor: T.border }}>
                    <span style={{ color: T.mutedLight }}>ID #{room.id}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditRoom(room)}
                        className="font-medium transition-colors"
                        style={{ color: T.primaryDark }}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        disabled={deletingRoomId === room.id}
                        className="text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        {deletingRoomId === room.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ROUTES TAB ═══ */}
      {tab === "routes" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
              <span className="font-semibold" style={{ color: T.text }}>
                {routes.length}
              </span>
              {` lộ trình`}
            </p>
            <button
              type="button"
              onClick={() => {
                if (showRouteForm) resetRouteForm();
                setShowRouteForm((v) => !v);
              }}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Plus className="h-4 w-4" />
              {showRouteForm ? "Đóng" : "Thêm lộ trình"}
            </button>
          </div>

          {/* Create route form */}
          {showRouteForm && (
            <form
              onSubmit={handleCreateRoute}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Tên lộ trình *
                  </label>
                  <input
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Hành trình khám phá di sản"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={routeMinutes}
                    onChange={(e) => setRouteMinutes(e.target.value)}
                    placeholder="45"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Mô tả
                  </label>
                  <textarea
                    value={routeDesc}
                    onChange={(e) => setRouteDesc(e.target.value)}
                    rows={3}
                    placeholder="Mô tả chi tiết lộ trình tham quan…"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                {exhibitions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>
                      Triển lãm
                    </label>
                    <select
                      value={routeExhibitionId}
                      onChange={(e) => setRouteExhibitionId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    >
                      <option value="">-- Không --</option>
                      {exhibitions.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name || `Triển lãm #${ex.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {ageGroups.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>
                      Nhóm tuổi
                    </label>
                    <select
                      value={routeAgeGroupId}
                      onChange={(e) => setRouteAgeGroupId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    >
                      <option value="">-- Không --</option>
                      {ageGroups.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.groupName}
                          {ag.minAge != null && ag.maxAge != null ? ` (${ag.minAge}–${ag.maxAge})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Select Artifacts (Stops) for this Route */}
                <div className="space-y-2 sm:col-span-2 pt-2 border-t" style={{ borderColor: T.border }}>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold" style={{ color: T.text }}>
                      Chọn hiện vật cho lộ trình ({selectedExhibitIds.length} điểm dừng)
                    </label>
                    {selectedExhibitIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedExhibitIds([])}
                        className="text-xs text-amber-600 hover:underline font-medium"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: T.muted }}>
                    Nhấn hiện vật theo thứ tự khách nên đi.
                  </p>

                  {exhibits.length === 0 ? (
                    <p className="text-xs italic" style={{ color: T.muted }}>Bảo tàng chưa có hiện vật.</p>
                  ) : (
                    <div
                      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto p-2.5 rounded-2xl border"
                      style={{ borderColor: T.border, background: T.bg }}
                    >
                      {exhibits.map((ex) => {
                        const isSelected = selectedExhibitIds.includes(ex.id);
                        const orderIdx = selectedExhibitIds.indexOf(ex.id);
                        const title = ex.translations?.[0]?.title ?? ex.exhibitCode ?? `Hiện vật #${ex.id}`;
                        const locText = ex.floorNumber != null || ex.roomCode || ex.roomName
                          ? `${ex.floorNumber != null ? `Tầng ${ex.floorNumber}` : ""} ${ex.roomCode ? `· ${ex.roomCode}` : ""}`.trim()
                          : "Chưa gán vị trí";

                        return (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => toggleRouteExhibit(ex.id)}
                            className="flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01]"
                            style={{
                              borderColor: isSelected ? T.primary : T.border,
                              background: isSelected ? "rgba(200,155,69,0.18)" : T.surface,
                            }}
                          >
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors"
                              style={{
                                background: isSelected ? T.primary : "rgba(200,155,69,0.15)",
                                color: isSelected ? T.surface : T.primaryDark,
                              }}
                            >
                              {isSelected ? `#${orderIdx + 1}` : "+"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: T.text }}>
                                {title}
                              </p>
                              <p className="text-[11px] truncate" style={{ color: T.muted }}>
                                {locText}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={routeIsDefault}
                      onChange={(e) => setRouteIsDefault(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: T.primary }}
                    />
                    <span className="text-sm" style={{ color: T.muted }}>
                      Đặt làm lộ trình mặc định
                    </span>
                  </label>
                </div>
              </div>
              {routeError && (
                <p className="mt-4 text-sm" style={{ color: "#8B2E2E" }}>
                  {routeError}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting === "route"}
                  className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ background: T.primary, color: T.surface }}
                >
                  {submitting === "route" ? "Đang lưu…" : "Lưu lộ trình"}
                </button>
              </div>
            </form>
          )}

          {/* Routes table */}
          <div
            className="overflow-hidden rounded-3xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            {routes.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <Route className="mx-auto h-10 w-10" style={{ color: T.mutedLight }} />
                <p className="mt-4 text-sm" style={{ color: T.muted }}>
                  Chưa có lộ trình. Tạo lộ trình gợi ý cho khách tham quan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: "rgba(245,230,200,0.35)",
                      }}
                    >
                      {["ID", "Tên lộ trình", "Mô tả", "Triển lãm", "Điểm dừng", "Thời lượng", "Trạng thái", ""].map((h) => (
                        <th
                          key={h || "actions"}
                          className="px-5 py-4 font-medium whitespace-nowrap"
                          style={{ color: T.mutedLight }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer transition-colors hover:bg-[rgba(200,155,69,0.04)]"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                        onClick={() => setSelectedRoute(item)}
                      >
                        <td className="px-5 py-4 font-medium" style={{ color: T.text }}>
                          {item.id}
                        </td>
                        <td className="px-5 py-4" style={{ color: T.text }}>
                          <div>
                            <p className="font-medium hover:underline">{item.name}</p>
                            {item.isDefault && (
                              <span
                                className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium"
                                style={{ color: T.success }}
                              >
                                <Check className="h-3 w-3" /> Mặc định
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]" style={{ color: T.muted }}>
                          <p className="truncate text-xs">
                            {item.description || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap" style={{ color: T.muted }}>
                          {item.exhibitionName || "—"}
                        </td>
                        <td className="px-5 py-4 text-center" style={{ color: T.text }}>
                          <span
                            className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full px-1.5 text-xs font-medium"
                            style={{
                              background: item.stops.length > 0 ? "rgba(79,125,74,0.12)" : "rgba(200,155,69,0.08)",
                              color: item.stops.length > 0 ? T.success : T.mutedLight,
                            }}
                          >
                            {item.stops.length}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5"
                            style={{ color: T.muted }}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {item.estimatedDurationMinutes != null
                              ? `${item.estimatedDurationMinutes} phút`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileSimRoute(item);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold shadow-sm transition-all hover:scale-105"
                              style={{
                                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                                color: T.surface,
                              }}
                            >
                              <Smartphone className="h-3.5 w-3.5" /> Bản đồ di động 📱
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoute(item);
                              }}
                              className="text-xs font-medium"
                              style={{ color: T.primaryDark }}
                            >
                              Chi tiết →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MAP DETAIL MODAL ═══ */}
      {selectedMap && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedMap(null)}
        >
          <div 
            className="relative max-w-4xl w-full rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setSelectedMap(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-sm font-semibold hover:bg-[rgba(200,155,69,0.15)] transition-colors"
              style={{ color: T.muted }}
            >
              ✕
            </button>

            <div className="flex-1 flex items-center justify-center bg-black/5 rounded-2xl overflow-hidden min-h-[300px] md:max-h-[70vh]">
              <img 
                src={selectedMap.mapImageUrl} 
                alt={getMapDisplayName(selectedMap)} 
                className="max-h-full max-w-full object-contain"
                style={{ maxHeight: "70vh", maxWidth: "100%", objectFit: "contain" }}
              />
            </div>

            <div className="w-full md:w-80 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.primaryDark }}>
                    {getMapDisplayName(selectedMap)}
                  </h3>
                  <p className="text-xs" style={{ color: T.mutedLight }}>Mã bản đồ: {selectedMap.id}</p>
                </div>

                <div className="space-y-2 border-t pt-4 text-sm" style={{ borderColor: T.border, color: T.muted }}>
                  <div className="flex justify-between">
                    <span>Tầng</span>
                    <span className="font-semibold" style={{ color: T.text }}>
                      {selectedMap.floorNumber === 0 ? "Tầng trệt (0)" : selectedMap.floorNumber ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loại</span>
                    <span className="font-semibold" style={{ color: T.text }}>
                      {mapKind(selectedMap) === "overview" ? "Tổng quan" : "Sơ đồ tầng"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liên kết ảnh</span>
                    <a 
                      href={selectedMap.mapImageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline truncate max-w-[150px] inline-block hover:text-black"
                      style={{ color: T.primaryDark }}
                    >
                      Mở ảnh gốc
                    </a>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedMap(null)}
                className="mt-6 w-full rounded-xl py-2.5 text-sm font-medium"
                style={{ background: T.primary, color: T.surface }}
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ROUTE DETAIL MODAL ═══ */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          exhibits={exhibits}
          onOpenMobileSimulator={() => setMobileSimRoute(selectedRoute)}
          onClose={() => setSelectedRoute(null)}
          onRefresh={() => {
            setSelectedRoute(null);
            router.refresh();
          }}
        />
      )}

      {/* ═══ MOBILE ROUTE SIMULATOR MODAL ═══ */}
      {mobileSimRoute && (
        <MobileRouteGuideModal
          route={mobileSimRoute}
          onClose={() => setMobileSimRoute(null)}
        />
      )}
    </div>
  );
}
