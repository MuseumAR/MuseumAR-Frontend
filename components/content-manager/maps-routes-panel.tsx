"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  Compass,
  Edit3,
  Info,
  Map,
  MapPin,
  Navigation,
  Plus,
  Route,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import { createMapWithImage } from "@/services/content-manager/maps-routes.service";
import { createRoom, deleteRoom, updateRoom } from "@/services/content-manager/room.service";
import { updateMuseumMap, deleteMuseumMap } from "@/services/content-manager/content-api.service";
import { NavigationGraphEditor } from "@/components/content-manager/navigation-graph-editor";
import { TourRoutesSection } from "@/components/content-manager/tour-routes-section";
import { SuccessBanner, useSuccessToast } from "@/components/shared/success-banner";
import type {
  AgeGroupDto,
  ExhibitDto,
  ExhibitionDto,
  MuseumMapDto,
  RoomDto,
  TourRouteDto,
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
   MAIN PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */

export function MapsRoutesPanel({
  maps: allMaps,
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
  const maps = useMemo(
    () => allMaps.filter((m) => m.mapType?.trim().toLowerCase() !== "route-thumb"),
    [allMaps],
  );
  const mapFileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("maps");
  const [showMapForm, setShowMapForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [mapType, setMapType] = useState("floor");
  const [mapName, setMapName] = useState("");
  const [floorNumber, setFloorNumber] = useState("1");
  const [selectedMap, setSelectedMap] = useState<MuseumMapDto | null>(null);

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

  const [mapError, setMapError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"map" | "room" | null>(null);

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
            <strong>Bản đồ & lộ trình</strong> quản lý sơ đồ 2D, phòng trưng bày, lộ trình tham quan và dẫn đường trong nhà cho ứng dụng di động.
          </p>
          <p>
            <strong>Bản đồ bảo tàng</strong> — ảnh sơ đồ tầng hoặc khu vực.{" "}
            <strong>Phòng trưng bày</strong> — phòng chính thức gắn với sơ đồ tầng.{" "}
            <strong>Lộ trình tham quan</strong> — danh sách điểm dừng theo thứ tự, gắn tầng/phòng khi có.{" "}
            <strong>Đồ thị dẫn đường</strong> — đường đi từ phòng A đến phòng B.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabBtn("maps", "Bản đồ bảo tàng", maps.length, MapPin)}
        {tabBtn("rooms", "Phòng trưng bày", rooms.length, Compass)}
        {tabBtn("routes", "Lộ trình tham quan", routes.length, Route)}
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

      {/* === ROUTES TAB === */}
      {tab === "routes" && (
        <TourRoutesSection
          routes={routes}
          exhibits={exhibits}
          exhibitions={exhibitions}
          ageGroups={ageGroups}
          museumId={museumId}
        />
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
    </div>
  );
}
