"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Edit3,
  ExternalLink,
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
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { resolveMapImageUrl } from "@/lib/resolve-media-url";
import { NavigationPanel } from "@/components/content-manager/navigation-panel";
import {
  addRouteStop,
  createMapWithImage,
  createRouteEntry,
  deleteMapEntry,
  deleteRouteEntry,
  removeRouteStop,
  updateMapEntry,
  updateRouteEntry,
} from "@/services/content-manager/maps-routes.service";
import { createRoom, deleteRoom } from "@/services/content-manager/room.service";
import type {
  AgeGroupDto,
  ExhibitDto,
  ExhibitionDto,
  MuseumMapDto,
  RoomDto,
  TourRouteDto,
  TourRouteStopDto,
} from "@/types/api";

type Tab = "maps" | "rooms" | "routes" | "navigation";

/* ═══════════════════════════════════════════════════════════════════════════════
   MAP HELPERS (unchanged)
   ═══════════════════════════════════════════════════════════════════════════════ */

function getMapDisplayName(item: MuseumMapDto): string {
  if (item.mapName?.trim()) return item.mapName.trim();
  const type = item.mapType?.trim() ?? "";
  // BE DTO puts MapName into MapType for seeded maps
  if (type && type !== "floor" && type !== "overview") return type;
  if (type === "overview" || item.floorNumber === 0) return "Overview";
  if (item.floorNumber === -1) return "Basement B1";
  if (item.floorNumber != null && item.floorNumber > 0) return `Floor ${item.floorNumber}`;
  return type === "overview" ? "Overview" : "Floor plan";
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
      {kind === "overview" ? "Overview" : "Floor plan"}
    </span>
  );
}

function MapPreview({ url, title }: { url: string; title: string }) {
  const resolved = resolveMapImageUrl(url);
  const [failed, setFailed] = useState(!resolved);

  if (!resolved || failed) {
    return (
      <div
        className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl px-4 text-center"
        style={{ background: "rgba(200,155,69,0.08)", border: `1px solid ${T.border}` }}
      >
        <Map className="h-8 w-8" style={{ color: T.mutedLight }} />
        <p className="text-xs" style={{ color: T.muted }}>
          Preview unavailable
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
        src={resolved}
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
      {status || "Active"}
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
              <p className="text-xs font-bold text-amber-300 leading-tight">Bản đồ Lộ trình Mobile</p>
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
              <span className="truncate">Đích: {nextRoomName}</span>
            </div>
          </div>

          {/* Turn-by-turn Guidance Banner */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <Compass className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[11px] leading-tight text-amber-200">
              <p className="font-bold">Hướng dẫn di chuyển:</p>
              <p className="mt-0.5 font-medium">
                {isFloorChange
                  ? `🚶‍♂️ Di chuyển thang bộ/thang máy từ ${currentFloorText} ➔ Tầng ${nextStop?.floorNumber} sang ${nextRoomName}`
                  : `➡️ Đi theo lối đi hành lang sang ${nextRoomName} để xem ${nextStop?.exhibitName || "Hiện vật kế tiếp"}`}
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
              Chỉ đường Live 📍
            </span>
          </div>

          {/* Dynamic Stops Grid */}
          {sortedStops.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Lộ trình này chưa có điểm dừng hiện vật nào.
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
                        {isCurrent ? "Đang ở đây" : isNext ? "Tiếp theo" : `Điểm #${stop.stopOrder}`}
                      </span>
                      {floorStr && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {floorStr}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">
                      {stop.exhibitName || `Exhibit #${stop.exhibitId}`}
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
            Điểm dừng {sortedStops.length > 0 ? `${currentStopIndex + 1}/${sortedStops.length}` : "1/2"}
          </span>

          <button
            type="button"
            onClick={handleNextStop}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1"
          >
            Điểm tiếp theo <ChevronRight className="h-3.5 w-3.5" />
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
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to add stop."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveStop(exhibitId: number) {
    setSaving(true);
    setError(null);
    try {
      await removeRouteStop(route.id, exhibitId);
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to remove stop."));
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
      setError(getDisplayError(err, "Unable to delete route."));
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    setSaving(true);
    setError(null);
    try {
      await updateRouteEntry(route.id, {
        name: editName.trim() || null,
        estimatedDurationMinutes: editDuration ? Number(editDuration) : undefined,
        status: editStatus || undefined,
      });
      setEditing(false);
      onRefresh();
    } catch (err) {
      setError(getDisplayError(err, "Unable to update route."));
    } finally {
      setSaving(false);
    }
  }

  function getExhibitDisplayName(exhibit: ExhibitDto): string {
    const vi = exhibit.translations?.find((t) => t.languageCode === "vi");
    const any = exhibit.translations?.[0];
    return vi?.title || any?.title || exhibit.exhibitCode || `Exhibit #${exhibit.id}`;
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
                className="text-xl font-bold"
                style={{ fontFamily: cinzel, color: T.primaryDark }}
              >
                {route.name}
              </h3>
            )}
            <p className="text-xs mt-1" style={{ color: T.mutedLight }}>
              Route ID: {route.id}
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
                <Smartphone className="h-3.5 w-3.5" /> Map Mobile 📱
              </button>
            )}
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl p-2 hover:bg-[rgba(200,155,69,0.1)] transition-colors"
                style={{ color: T.primaryDark }}
                title="Edit route"
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
            <p className="text-xs" style={{ color: T.mutedLight }}>Duration</p>
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
                {route.estimatedDurationMinutes ? `${route.estimatedDurationMinutes} min` : "—"}
              </p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: T.mutedLight }}>Status</p>
            {editing ? (
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            ) : (
              <StatusBadge status={route.status} />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs" style={{ color: T.mutedLight }}>Stops</p>
            <p className="text-sm font-medium" style={{ color: T.text }}>
              {route.stops.length} điểm dừng
            </p>
          </div>
          {route.exhibitionName && (
            <div className="space-y-0.5">
              <p className="text-xs" style={{ color: T.mutedLight }}>Exhibition</p>
              <p className="text-sm font-medium" style={{ color: T.text }}>
                {route.exhibitionName}
              </p>
            </div>
          )}
          {route.ageGroupName && (
            <div className="space-y-0.5">
              <p className="text-xs" style={{ color: T.mutedLight }}>Age group</p>
              <p className="text-sm font-medium" style={{ color: T.text }}>
                {route.ageGroupName}
              </p>
            </div>
          )}
          {route.isDefault && (
            <div className="space-y-0.5">
              <p className="text-xs" style={{ color: T.mutedLight }}>Default</p>
              <p className="text-sm font-medium flex items-center gap-1" style={{ color: T.success }}>
                <Check className="h-3.5 w-3.5" /> Default route
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {(route.description || editing) && (
          <div className="mb-6">
            <p className="text-xs mb-1.5 font-medium" style={{ color: T.mutedLight }}>
              Description
            </p>
            {editing ? (
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                placeholder="Mô tả tour route…"
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
              {saving ? "Saving…" : "Save changes"}
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
              Cancel
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
                  <label className="text-xs" style={{ color: T.muted }}>Chọn exhibit *</label>
                  <select
                    value={selectedExhibitId}
                    onChange={(e) => setSelectedExhibitId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
                  >
                    <option value="">-- Chọn exhibit --</option>
                    {availableExhibits.map((e) => (
                      <option key={e.id} value={e.id}>
                        {getExhibitDisplayName(e)} (#{e.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs" style={{ color: T.muted }}>Thời gian (phút)</label>
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
                  {saving ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingStop(false); setSelectedExhibitId(""); setStopMinutes(""); }}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium"
                  style={{ border: `1px solid ${T.border}`, color: T.muted }}
                >
                  Cancel
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
                Chưa có điểm dừng nào. Thêm exhibit để tạo lộ trình tham quan.
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
                      {stop.exhibitName || `Exhibit #${stop.exhibitId}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: T.mutedLight }}>
                      {stop.exhibitCode && <span>Code: {stop.exhibitCode}</span>}
                      {stop.estimatedMinutes != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {stop.estimatedMinutes} min
                        </span>
                      )}
                      {stop.floorNumber != null && <span>Floor {stop.floorNumber}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(stop.exhibitId)}
                    disabled={saving}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 transition-all hover:bg-red-50"
                    style={{ color: "#B45309" }}
                    title="Remove stop"
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
              Translations ({route.translations.length})
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

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm" style={{ color: "#8B2E2E" }}>
            {error}
          </p>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: `1px solid ${T.border}` }}
        >
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "#8B2E2E" }}>
                Xác nhận xóa route này?
              </span>
              <button
                type="button"
                onClick={handleDeleteRoute}
                disabled={saving}
                className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                style={{ background: "#8B2E2E", color: "#fff" }}
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: "#8B2E2E" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete route
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-medium"
            style={{ background: T.primary, color: T.surface }}
          >
            Close
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
  routes,
  rooms = [],
  museumId,
  exhibitions = [],
  ageGroups = [],
  exhibits = [],
}: {
  maps: MuseumMapDto[];
  routes: TourRouteDto[];
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
  const [roomFloorNumber, setRoomFloorNumber] = useState("1");
  const [roomMapId, setRoomMapId] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

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
  const [editingMap, setEditingMap] = useState(false);
  const [editMapName, setEditMapName] = useState("");
  const [editFloorNumber, setEditFloorNumber] = useState("0");
  const [editMapFile, setEditMapFile] = useState<File | null>(null);
  const [editMapError, setEditMapError] = useState<string | null>(null);
  const [mapActionBusy, setMapActionBusy] = useState(false);

  function toggleRouteExhibit(id: number) {
    setSelectedExhibitIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!routeName.trim()) {
      setRouteError("Route name is required.");
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
      router.refresh();
    } catch (err) {
      setRouteError(getDisplayError(err, "Unable to create route."));
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

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!roomCode.trim() || !roomName.trim()) {
      setRoomError("Room code and room name are required.");
      return;
    }
    setSubmitting("room");
    setRoomError(null);
    try {
      await createRoom({
        museumId,
        mapId: roomMapId ? Number(roomMapId) : undefined,
        roomCode: roomCode.trim(),
        roomName: roomName.trim(),
        floorNumber: Number(roomFloorNumber),
        description: roomDesc.trim() || undefined,
      });
      setRoomCode("");
      setRoomName("");
      setRoomDesc("");
      setRoomMapId("");
      setRoomFloorNumber("1");
      setShowRoomForm(false);
      router.refresh();
    } catch (err) {
      setRoomError(getDisplayError(err, "Unable to create room."));
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteRoom(id: number) {
    setDeletingRoomId(id);
    setRoomError(null);
    try {
      await deleteRoom(id);
      router.refresh();
    } catch (err) {
      setRoomError(getDisplayError(err, "Unable to delete room."));
    } finally {
      setDeletingRoomId(null);
    }
  }

  async function handleCreateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!mapFile) {
      setMapError("Please choose a map image from your device.");
      return;
    }
    if (!mapName.trim()) {
      setMapError("Map name is required.");
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
      router.refresh();
    } catch (err) {
      setMapError(getDisplayError(err, "Unable to upload map."));
    } finally {
      setSubmitting(null);
    }
  }

  function handleMapFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMapError("Please select an image file (PNG, JPG, …).");
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
            <strong>Maps & Routes</strong> manages 2D floor plans and suggested visit routes for the mobile app.
          </p>
          <p>
            <strong>Museum maps</strong> — floor or area layout images.{" "}
            <strong>Tour routes</strong> — suggested visit paths with stops, descriptions, and estimated duration.{" "}
            <strong>Chỉ đường</strong> — waypoint graph (edges) để mobile tính đường phòng → phòng.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabBtn("maps", "Museum maps", maps.length, MapPin)}
        {tabBtn("rooms", "Phòng trưng bày", rooms.length, Compass)}
        {tabBtn("routes", "Tour routes", routes.length, Route)}
        {tabBtn("navigation", "Chỉ đường", 0, Navigation)}
      </div>

      {/* ═══ MAPS TAB ═══ */}
      {tab === "maps" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
              <span className="font-semibold" style={{ color: T.text }}>
                {maps.length}
              </span>
              {` map${maps.length === 1 ? "" : "s"}`}
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
              {showMapForm ? "Close" : "Add map"}
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
                    Map image *
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
                        <span className="text-sm">Click to choose image from your device</span>
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
                      Selected: {mapFile.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Map Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bản đồ Tầng trệt, Bản đồ Lầu 1"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Map Type
                  </label>
                  <select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="floor">Floor plan</option>
                    <option value="overview">Overview</option>
                  </select>
                </div>
                {mapType === "floor" && (
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>
                      Floor Number *
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
                  {submitting === "map" ? "Uploading…" : "Upload map"}
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
                No museum maps yet. Add a floor plan or overview image.
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
                        Map #{item.id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MapTypeBadge kind={kind} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {item.mapImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedMap(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{ color: T.primaryDark }}
                        >
                          <Info className="h-3.5 w-3.5" />
                          Detail
                        </button>
                      ) : null}
                      {item.mapImageUrl ? (
                        <a
                          href={resolveMapImageUrl(item.mapImageUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{ color: T.mutedLight }}
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </a>
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

      {/* ═══ ROOMS TAB ═══ */}
      {tab === "rooms" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
              <span className="font-semibold" style={{ color: T.text }}>
                {rooms.length}
              </span>
              {` phòng trưng bày chính thức`}
            </p>
            <button
              type="button"
              onClick={() => setShowRoomForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <Plus className="h-4 w-4" />
              {showRoomForm ? "Close" : "Khai báo Phòng mới"}
            </button>
          </div>

          {showRoomForm && (
            <form
              onSubmit={handleCreateRoom}
              className="rounded-3xl p-6"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <h3 className="mb-4 text-lg font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
                Khai báo Phòng trưng bày mới
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Mã phòng * (VD: P102)
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
                    Tên phòng * (VD: Phòng 102 - Văn hóa Đông Sơn)
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
                    Số tầng *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomFloorNumber}
                    onChange={(e) => setRoomFloorNumber(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Liên kết Bản đồ Tầng (Tùy chọn)
                  </label>
                  <select
                    value={roomMapId}
                    onChange={(e) => setRoomMapId(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  >
                    <option value="">-- Không gán bản đồ cụ thể --</option>
                    {maps.map((m) => (
                      <option key={m.id} value={m.id}>
                        Tầng {m.floorNumber} {m.mapName ? `(${m.mapName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Mô tả phòng trưng bày
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả nội dung các hiện vật được trưng bày trong phòng này..."
                    value={roomDesc}
                    onChange={(e) => setRoomDesc(e.target.value)}
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
                  onClick={() => setShowRoomForm(false)}
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
                  {submitting === "room" ? "Đang tạo..." : "Lưu Phòng mới"}
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
              <p className="font-semibold" style={{ color: T.text }}>Chưa có phòng trưng bày nào</p>
              <p className="mt-1 text-sm" style={{ color: T.muted }}>
                Khai báo danh sách phòng chính thức để gán hiện vật và tạo lộ trình di chuyển.
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
                    {room.description && (
                      <p className="text-xs line-clamp-2" style={{ color: T.muted }}>
                        {room.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs border-t" style={{ borderColor: T.border }}>
                    <span style={{ color: T.mutedLight }}>ID #{room.id}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      disabled={deletingRoomId === room.id}
                      className="text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      {deletingRoomId === room.id ? "Đang xóa..." : "Xóa phòng"}
                    </button>
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
              {` route${routes.length === 1 ? "" : "s"}`}
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
              {showRouteForm ? "Close" : "Add route"}
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
                    Route name *
                  </label>
                  <input
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Hành trình Khám phá Di sản"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm" style={{ color: T.muted }}>
                    Duration (minutes)
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
                    Description
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
                      Exhibition
                    </label>
                    <select
                      value={routeExhibitionId}
                      onChange={(e) => setRouteExhibitionId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    >
                      <option value="">-- None --</option>
                      {exhibitions.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name || `Exhibition #${ex.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {ageGroups.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-sm" style={{ color: T.muted }}>
                      Age group
                    </label>
                    <select
                      value={routeAgeGroupId}
                      onChange={(e) => setRouteAgeGroupId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    >
                      <option value="">-- None --</option>
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
                      Chọn Hiện vật thuộc Lộ trình ({selectedExhibitIds.length} điểm dừng)
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
                    Nhấp chọn các hiện vật theo thứ tự di chuyển mong muốn cho khách tham quan.
                  </p>

                  {exhibits.length === 0 ? (
                    <p className="text-xs italic" style={{ color: T.muted }}>Chưa có hiện vật nào trong bảo tàng.</p>
                  ) : (
                    <div
                      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto p-2.5 rounded-2xl border"
                      style={{ borderColor: T.border, background: T.bg }}
                    >
                      {exhibits.map((ex) => {
                        const isSelected = selectedExhibitIds.includes(ex.id);
                        const orderIdx = selectedExhibitIds.indexOf(ex.id);
                        const title = ex.translations?.[0]?.title ?? ex.exhibitCode ?? `Exhibit #${ex.id}`;
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
                      Set as default route
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
                  {submitting === "route" ? "Saving…" : "Save route"}
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
                  No tour routes yet. Create a suggested visit path for visitors.
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
                      {["ID", "Route name", "Description", "Exhibition", "Stops", "Duration", "Status", ""].map((h) => (
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
                                <Check className="h-3 w-3" /> Default
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
                              ? `${item.estimatedDurationMinutes} min`
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
                              <Smartphone className="h-3.5 w-3.5" /> Map Mobile 📱
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
                              Detail →
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

      {/* ═══ NAVIGATION TAB ═══ */}
      {tab === "navigation" && (
        <NavigationPanel maps={maps} rooms={rooms} museumId={museumId} />
      )}

      {/* ═══ MAP DETAIL MODAL ═══ */}
      {selectedMap && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setSelectedMap(null);
            setEditingMap(false);
            setEditMapError(null);
            setEditMapFile(null);
          }}
        >
          <div 
            className="relative max-w-4xl w-full rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => {
                setSelectedMap(null);
                setEditingMap(false);
                setEditMapError(null);
                setEditMapFile(null);
              }}
              className="absolute top-4 right-4 rounded-full p-2 text-sm font-semibold hover:bg-[rgba(200,155,69,0.15)] transition-colors"
              style={{ color: T.muted }}
            >
              ✕
            </button>

            <div className="flex-1 flex items-center justify-center bg-black/5 rounded-2xl overflow-hidden min-h-[300px] md:max-h-[70vh]">
              <img 
                src={resolveMapImageUrl(selectedMap.mapImageUrl)} 
                alt={getMapDisplayName(selectedMap)} 
                className="max-h-full max-w-full object-contain"
                style={{ maxHeight: "70vh", maxWidth: "100%", objectFit: "contain" }}
              />
            </div>

            <div className="w-full md:w-80 flex flex-col justify-between gap-4">
              {editingMap ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold" style={{ fontFamily: cinzel, color: T.primaryDark }}>
                    Sửa bản đồ
                  </h3>
                  <div className="space-y-1.5">
                    <label className="block text-xs" style={{ color: T.muted }}>Tên hiển thị</label>
                    <input
                      value={editMapName}
                      onChange={(e) => setEditMapName(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs" style={{ color: T.muted }}>Tầng (FloorNumber)</label>
                    <input
                      type="number"
                      value={editFloorNumber}
                      onChange={(e) => setEditFloorNumber(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs" style={{ color: T.muted }}>Đổi ảnh (tuỳ chọn)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditMapFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs"
                      style={{ color: T.muted }}
                    />
                  </div>
                  {editMapError && (
                    <p className="text-xs" style={{ color: "#8B2E2E" }}>{editMapError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={mapActionBusy}
                      onClick={() => {
                        setEditingMap(false);
                        setEditMapError(null);
                        setEditMapFile(null);
                      }}
                      className="flex-1 rounded-xl py-2 text-sm disabled:opacity-50"
                      style={{ border: `1px solid ${T.border}`, color: T.muted }}
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      disabled={mapActionBusy}
                      onClick={() => void (async () => {
                        setMapActionBusy(true);
                        setEditMapError(null);
                        try {
                          const floor = Number(editFloorNumber);
                          await updateMapEntry(selectedMap.id, {
                            mapName: editMapName.trim() || undefined,
                            floorNumber: Number.isFinite(floor) ? floor : undefined,
                            mapImage: editMapFile,
                          });
                          setEditingMap(false);
                          setEditMapFile(null);
                          setSelectedMap(null);
                          router.refresh();
                        } catch (err) {
                          setEditMapError(getDisplayError(err, "Không thể cập nhật map."));
                        } finally {
                          setMapActionBusy(false);
                        }
                      })()}
                      className="flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-50"
                      style={{ background: T.primary, color: T.surface }}
                    >
                      {mapActionBusy ? "Đang lưu…" : "Lưu"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold" style={{ fontFamily: cinzel, color: T.primaryDark }}>
                        {getMapDisplayName(selectedMap)}
                      </h3>
                      <p className="text-xs" style={{ color: T.mutedLight }}>Map ID: {selectedMap.id}</p>
                    </div>

                    <div className="space-y-2 border-t pt-4 text-sm" style={{ borderColor: T.border, color: T.muted }}>
                      <div className="flex justify-between">
                        <span>Floor</span>
                        <span className="font-semibold" style={{ color: T.text }}>
                          {selectedMap.floorNumber === 0 ? "Ground floor (0)" : selectedMap.floorNumber ?? "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span className="font-semibold capitalize" style={{ color: T.text }}>
                          {mapKind(selectedMap)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Image Link</span>
                        <a 
                          href={resolveMapImageUrl(selectedMap.mapImageUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline truncate max-w-[150px] inline-block hover:text-black"
                          style={{ color: T.primaryDark }}
                        >
                          Open original
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMapName(
                          selectedMap.mapName?.trim() ||
                            (selectedMap.mapType !== "floor" && selectedMap.mapType !== "overview"
                              ? selectedMap.mapType
                              : getMapDisplayName(selectedMap)),
                        );
                        setEditFloorNumber(String(selectedMap.floorNumber ?? 0));
                        setEditMapFile(null);
                        setEditMapError(null);
                        setEditingMap(true);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                      style={{ border: `1px solid ${T.border}`, color: T.text }}
                    >
                      <Edit3 className="h-4 w-4" />
                      Sửa map
                    </button>
                    <button
                      type="button"
                      disabled={mapActionBusy}
                      onClick={() => void (async () => {
                        if (!confirm(`Xóa map #${selectedMap.id}?`)) return;
                        setMapActionBusy(true);
                        try {
                          await deleteMapEntry(selectedMap.id);
                          setSelectedMap(null);
                          router.refresh();
                        } catch (err) {
                          alert(getDisplayError(err, "Không thể xóa map."));
                        } finally {
                          setMapActionBusy(false);
                        }
                      })()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
                      style={{
                        background: "rgba(184,92,56,0.1)",
                        color: "#8B3A22",
                        border: "1px solid rgba(184,92,56,0.3)",
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa map
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedMap(null)}
                      className="w-full rounded-xl py-2.5 text-sm font-medium"
                      style={{ background: T.primary, color: T.surface }}
                    >
                      Close Detail
                    </button>
                  </div>
                </>
              )}
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
