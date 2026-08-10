"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link2,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { repairDisplayText } from "@/lib/repair-text";
import { resolveMapImageUrl } from "@/lib/resolve-media-url";
import { getDisplayError } from "@/lib/validation";
import {
  createWaypoint,
  createWaypointEdge,
  deleteWaypoint,
  deleteWaypointEdge,
  getMapNavigationGraph,
  navigateBetweenRooms,
} from "@/services/content-manager/navigation.service";
import type {
  MuseumMapDto,
  NavigationRouteResponseDto,
  RoomDto,
  WaypointDto,
  WaypointEdgeDto,
  WaypointType,
} from "@/types/api";

const WAYPOINT_TYPES: WaypointType[] = [
  "HALLWAY",
  "ROOM",
  "DOOR",
  "STAIRS",
  "ELEVATOR",
  "ENTRANCE",
  "EXIT",
];


const WAYPOINT_TYPE_LABEL: Record<string, string> = {
  HALLWAY: "Hành lang",
  ROOM: "Phòng",
  DOOR: "Cửa",
  STAIRS: "Cầu thang",
  ELEVATOR: "Thang máy",
  ENTRANCE: "Lối vào",
  EXIT: "Lối ra",
};

function waypointTypeLabel(type: string): string {
  return WAYPOINT_TYPE_LABEL[type] ?? type;
}


type Mode = "place" | "connect";

function getMapDisplayName(item: MuseumMapDto): string {
  if (item.mapName?.trim()) return repairDisplayText(item.mapName.trim());
  const type = repairDisplayText(item.mapType?.trim() ?? "");
  if (type && type !== "floor" && type !== "overview") return type;
  if (type === "overview" || item.floorNumber === 0) return "Overview";
  if (item.floorNumber === -1) return "Basement B1";
  if (item.floorNumber != null && item.floorNumber > 0) return `Floor ${item.floorNumber}`;
  return type === "overview" ? "Overview" : "Floor plan";
}

function waypointColor(type: string): string {
  switch (type) {
    case "ROOM":
      return "#4F7D4A";
    case "DOOR":
      return "#C89B45";
    case "STAIRS":
    case "ELEVATOR":
      return "#6B5B95";
    case "ENTRANCE":
    case "EXIT":
      return "#B85C38";
    default:
      return "#3D5A80";
  }
}

function dist(
  a: { locationX: number; locationY: number },
  b: { locationX: number; locationY: number },
) {
  const dx = a.locationX - b.locationX;
  const dy = a.locationY - b.locationY;
  return Math.round(Math.hypot(dx, dy) * 10) / 10;
}

export function NavigationPanel({
  maps,
  rooms,
  museumId,
}: {
  maps: MuseumMapDto[];
  rooms: RoomDto[];
  museumId: number;
}) {
  const [mapId, setMapId] = useState<number | "">(maps[0]?.id ?? "");
  const [waypoints, setWaypoints] = useState<WaypointDto[]>([]);
  const [edges, setEdges] = useState<WaypointEdgeDto[]>([]);
  const [mode, setMode] = useState<Mode>("place");
  const [waypointType, setWaypointType] = useState<WaypointType>("HALLWAY");
  const [roomId, setRoomId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fromRoomId, setFromRoomId] = useState("");
  const [toRoomId, setToRoomId] = useState("");
  const [routeResult, setRouteResult] = useState<NavigationRouteResponseDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Adjust selected map when maps prop arrives / changes (allowed during render).
  const firstMapId = maps[0]?.id;
  if (!mapId && firstMapId != null) {
    setMapId(firstMapId);
  } else if (
    typeof mapId === "number" &&
    maps.length > 0 &&
    !maps.some((m) => m.id === mapId) &&
    firstMapId != null
  ) {
    setMapId(firstMapId);
  }

  const selectedMap = useMemo(
    () => maps.find((m) => m.id === mapId) ?? null,
    [maps, mapId],
  );

  const roomsOnMap = useMemo(() => {
    if (!selectedMap) return rooms;
    return rooms.filter(
      (r) =>
        r.mapId == null ||
        r.mapId === selectedMap.id ||
        r.floorNumber === selectedMap.floorNumber,
    );
  }, [rooms, selectedMap]);

  const pathIds = useMemo(() => {
    if (!routeResult) return new Set<string>();
    return new Set(routeResult.pathWaypoints.map((w) => w.id));
  }, [routeResult]);

  const loadGraph = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    setRouteResult(null);
    setSelectedIds([]);
    try {
      const graph = await getMapNavigationGraph(id);
      setWaypoints(graph.waypoints);
      setEdges(graph.edges);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tải graph. Thử lại."));
      setWaypoints([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof mapId !== "number" || mapId <= 0) return;
    let cancelled = false;
    void (async () => {
      // Yield so setState is not synchronous inside the effect body.
      await Promise.resolve();
      if (cancelled) return;
      await loadGraph(mapId);
    })();
    return () => {
      cancelled = true;
    };
  }, [mapId, loadGraph]);

  const waypointById = useMemo(() => {
    const map = new Map<string, WaypointDto>();
    for (const w of waypoints) map.set(w.id, w);
    return map;
  }, [waypoints]);


  const selectedWaypoints = useMemo(
    () => selectedIds.map((id) => waypointById.get(id)).filter(Boolean) as WaypointDto[],
    [selectedIds, waypointById],
  );

  function roomLabelForWaypoint(wp: WaypointDto): string | null {
    if (wp.roomId == null) return null;
    const room = rooms.find((r) => r.id === wp.roomId);
    if (!room) return `Phòng #${wp.roomId}`;
    const code = room.roomCode ? `${room.roomCode} · ` : "";
    return code + repairDisplayText(room.roomName);
  }


  async function handlePlace(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "place" || !selectedMap || busy) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right) return;
    if (e.clientY < rect.top || e.clientY > rect.bottom) return;

    const locationX =
      Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const locationY =
      Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    setBusy(true);
    setError(null);
    try {
      const created = await createWaypoint({
        museumId,
        mapId: selectedMap.id,
        floorNumber: selectedMap.floorNumber ?? 1,
        locationX,
        locationY,
        waypointType,
        roomId:
          waypointType === "ROOM" && roomId ? Number(roomId) : null,
      });
      setWaypoints((prev) => [...prev, created]);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tạo waypoint. Thử lại."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectWaypoint(id: string) {
    if (mode === "place") {
      setSelectedIds([id]);
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  async function handleConnect() {
    if (selectedIds.length !== 2 || !selectedMap || busy) return;
    const [fromId, toId] = selectedIds;
    const from = waypointById.get(fromId);
    const to = waypointById.get(toId);
    if (!from || !to) return;

    setBusy(true);
    setError(null);
    try {
      const edge = await createWaypointEdge({
        museumId,
        fromWaypointId: fromId,
        toWaypointId: toId,
        distance: dist(from, to),
        edgeType: "WALK",
        isBidirectional: true,
      });
      setEdges((prev) => [...prev, edge]);
      setSelectedIds([]);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tạo edge. Thử lại."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      for (const id of selectedIds) {
        await deleteWaypoint(id);
      }
      setWaypoints((prev) => prev.filter((w) => !selectedIds.includes(w.id)));
      setEdges((prev) =>
        prev.filter(
          (e) =>
            !selectedIds.includes(e.fromWaypointId) &&
            !selectedIds.includes(e.toWaypointId),
        ),
      );
      setSelectedIds([]);
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa waypoint. Thử lại."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteEdge(id: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteWaypointEdge(id);
      setEdges((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(getDisplayError(err, "Không thể xóa edge. Thử lại."));
    } finally {
      setBusy(false);
    }
  }

  async function handleNavigate() {
    const from = Number(fromRoomId);
    const to = Number(toRoomId);
    if (!from || !to) {
      setError("Chọn phòng đi và phòng đến.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await navigateBetweenRooms(from, to);
      setRouteResult(result);
    } catch (err) {
      setError(getDisplayError(err, "Không thể tính tuyến đường. Thử lại."));
      setRouteResult(null);
    } finally {
      setBusy(false);
    }
  }

  if (!maps.length) {
    return (
      <div
        className="rounded-3xl p-8 text-center text-sm"
        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}
      >
        Cần có ít nhất một museum map trước khi gắn waypoint chỉ đường.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm" style={{ color: T.muted }}>
            Bản đồ
          </label>
          <select
            value={mapId}
            onChange={(e) => setMapId(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
              minWidth: 220,
            }}
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {getMapDisplayName(m)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => typeof mapId === "number" && loadGraph(mapId)}
          disabled={loading || typeof mapId !== "number"}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.muted,
          }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại graph
        </button>

        <p className="text-sm" style={{ fontFamily: cinzel, color: T.muted }}>
          <span className="font-semibold" style={{ color: T.text }}>
            {waypoints.length}
          </span>{" "}
          waypoints ·{" "}
          <span className="font-semibold" style={{ color: T.text }}>
            {edges.length}
          </span>{" "}
          edges
        </p>
      </div>

      {error && (
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            background: "rgba(184,92,56,0.1)",
            border: "1px solid rgba(184,92,56,0.35)",
            color: "#8B3A22",
          }}
        >
          {repairDisplayText(error)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{ background: T.bg, border: `1px solid ${T.border}` }}
        >
          {!selectedMap?.mapImageUrl ? (
            <div className="flex h-80 items-center justify-center text-sm" style={{ color: T.muted }}>
              Map chưa có ảnh
            </div>
          ) : (
            <div
              className={`relative ${mode === "place" ? "cursor-crosshair" : "cursor-default"}`}
              onClick={(e) => void handlePlace(e)}
            >
              <img
                ref={imgRef}
                src={resolveMapImageUrl(selectedMap.mapImageUrl)}
                alt={getMapDisplayName(selectedMap)}
                className="block w-full select-none"
                draggable={false}
              />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {edges.map((edge) => {
                  const from = waypointById.get(edge.fromWaypointId);
                  const to = waypointById.get(edge.toWaypointId);
                  if (!from || !to) return null;
                  const onPath =
                    pathIds.has(from.id) && pathIds.has(to.id);
                  return (
                    <line
                      key={edge.id}
                      x1={from.locationX}
                      y1={from.locationY}
                      x2={to.locationX}
                      y2={to.locationY}
                      stroke={onPath ? "#B85C38" : "rgba(61,90,128,0.55)"}
                      strokeWidth={onPath ? 0.9 : 0.45}
                      strokeLinecap="round"
                    />
                  );
                })}
                {routeResult?.pathWaypoints.length
                  ? routeResult.pathWaypoints.slice(0, -1).map((wp, i) => {
                      const next = routeResult.pathWaypoints[i + 1];
                      if (!next) return null;
                      return (
                        <line
                          key={`path-${wp.id}-${next.id}`}
                          x1={wp.locationX}
                          y1={wp.locationY}
                          x2={next.locationX}
                          y2={next.locationY}
                          stroke="#B85C38"
                          strokeWidth={1.1}
                          strokeLinecap="round"
                        />
                      );
                    })
                  : null}
              </svg>

              {waypoints.map((wp) => {
                const selected = selectedIds.includes(wp.id);
                const onPath = pathIds.has(wp.id);
                const typeLabel = waypointTypeLabel(wp.waypointType);
                const roomLabel = roomLabelForWaypoint(wp);
                const displayName =
                  repairDisplayText(wp.name ?? "") ||
                  roomLabel ||
                  typeLabel;
                return (
                  <div
                    key={wp.id}
                    className="absolute z-2"
                    style={{
                      left: `${wp.locationX}%`,
                      top: `${wp.locationY}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: selected ? 4 : onPath ? 3 : 2,
                    }}
                  >
                    <button
                      type="button"
                      title={`${typeLabel}${wp.name ? ` · ${repairDisplayText(wp.name)}` : ""}${roomLabel ? ` · ${roomLabel}` : ""} (${wp.locationX}, ${wp.locationY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleSelectWaypoint(wp.id);
                      }}
                      className="relative rounded-full border-2 shadow-sm transition-transform hover:scale-110"
                      style={{
                        width: selected || onPath ? 16 : 12,
                        height: selected || onPath ? 16 : 12,
                        background: waypointColor(wp.waypointType),
                        borderColor: selected
                          ? T.primary
                          : onPath
                            ? "#B85C38"
                            : "#fff",
                      }}
                    />
                    {selected && (
                      <span
                        className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium shadow-sm"
                        style={{
                          background: T.primaryDark,
                          color: "#FFF8E7",
                        }}
                      >
                        {typeLabel}
                        {displayName !== typeLabel ? ` · ${displayName}` : ""}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="space-y-4 rounded-3xl p-5"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: cinzel, color: T.primaryDark }}
            >
              Công cụ
            </h3>

            <div className="flex gap-2">
              {(
                [
                  ["place", "Đặt điểm", Plus],
                  ["connect", "Nối cạnh", Link2],
                ] as const
              ).map(([id, label, Icon]) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setMode(id);
                      setSelectedIds([]);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`
                        : T.bg,
                      color: active ? T.surface : T.muted,
                      border: active ? "none" : `1px solid ${T.border}`,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {mode === "place" && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: T.muted }}>
                  Click lên bản đồ để tạo waypoint.
                </p>
                <div className="space-y-1.5">
                  <label className="block text-xs" style={{ color: T.muted }}>
                    Loại
                  </label>
                  <select
                    value={waypointType}
                    onChange={(e) => {
                      const next = e.target.value as WaypointType;
                      setWaypointType(next);
                      if (next !== "ROOM") setRoomId("");
                    }}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                    }}
                  >
                    {WAYPOINT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {waypointTypeLabel(t)} ({t})
                      </option>
                    ))}
                  </select>
                </div>
                {waypointType === "ROOM" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs" style={{ color: T.muted }}>
                      Gắn phòng
                    </label>
                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                      style={{
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        color: T.text,
                      }}
                    >
                      <option value="">— Chọn phòng —</option>
                      {roomsOnMap.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roomCode ? `${r.roomCode} · ` : ""}
                          {repairDisplayText(r.roomName)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {mode === "connect" && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: T.muted }}>
                  Chọn 2 waypoint rồi tạo cạnh. Distance = khoảng cách toạ độ %.
                </p>
                <p className="text-xs" style={{ color: T.text }}>
                  Đã chọn: {selectedIds.length}/2
                </p>
                {selectedWaypoints.length > 0 && (
                  <ul className="space-y-1.5 text-xs" style={{ color: T.muted }}>
                    {selectedWaypoints.map((wp, idx) => (
                      <li key={wp.id} style={{ color: T.text }}>
                        {idx + 1}. {waypointTypeLabel(wp.waypointType)}
                        {wp.name ? ` · ${repairDisplayText(wp.name)}` : ""}
                        {roomLabelForWaypoint(wp)
                          ? ` · ${roomLabelForWaypoint(wp)}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  disabled={selectedIds.length !== 2 || busy}
                  onClick={() => void handleConnect()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                    color: T.surface,
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  Tạo edge
                </button>
              </div>
            )}

            {selectedWaypoints.length > 0 && (
              <div
                className="space-y-2 rounded-2xl p-3"
                style={{
                  background: "rgba(200,155,69,0.10)",
                  border: `1px solid ${T.border}`,
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: T.primaryDark }}
                >
                  Waypoint đã chọn
                </p>
                {selectedWaypoints.map((wp) => {
                  const roomLabel = roomLabelForWaypoint(wp);
                  return (
                    <div
                      key={wp.id}
                      className="space-y-1 rounded-xl px-3 py-2 text-xs"
                      style={{ background: T.surface, color: T.muted }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: waypointColor(wp.waypointType) }}
                        />
                        <span className="font-semibold" style={{ color: T.text }}>
                          {waypointTypeLabel(wp.waypointType)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: "rgba(200,155,69,0.18)",
                            color: T.primaryDark,
                          }}
                        >
                          {wp.waypointType}
                        </span>
                      </div>
                      {wp.name ? (
                        <p>
                          Tên:{" "}
                          <span style={{ color: T.text }}>
                            {repairDisplayText(wp.name)}
                          </span>
                        </p>
                      ) : null}
                      {roomLabel ? (
                        <p>
                          Phòng: <span style={{ color: T.text }}>{roomLabel}</span>
                        </p>
                      ) : null}
                      <p>
                        Toạ độ:{" "}
                        <span style={{ color: T.text }}>
                          {wp.locationX}, {wp.locationY}
                        </span>
                      </p>
                      <p className="truncate">
                        ID: <span style={{ color: T.text }}>{wp.id}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDeleteSelected()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
                style={{
                  background: "rgba(184,92,56,0.1)",
                  color: "#8B3A22",
                  border: "1px solid rgba(184,92,56,0.3)",
                }}
              >
                <Trash2 className="h-4 w-4" />
                Xóa waypoint đã chọn
              </button>
            )}
          </div>

          <div
            className="space-y-4 rounded-3xl p-5"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <h3
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ fontFamily: cinzel, color: T.primaryDark }}
            >
              <Navigation className="h-4 w-4" />
              Thử chỉ đường
            </h3>
            <div className="space-y-1.5">
              <label className="block text-xs" style={{ color: T.muted }}>
                Từ phòng
              </label>
              <select
                value={fromRoomId}
                onChange={(e) => setFromRoomId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              >
                <option value="">— Chọn —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {repairDisplayText(r.roomName)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs" style={{ color: T.muted }}>
                Đến phòng
              </label>
              <select
                value={toRoomId}
                onChange={(e) => setToRoomId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              >
                <option value="">— Chọn —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {repairDisplayText(r.roomName)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleNavigate()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
              }}
            >
              <MapPin className="h-4 w-4" />
              Tính tuyến đường
            </button>

            {routeResult && (
              <div className="space-y-2 border-t pt-3" style={{ borderColor: T.border }}>
                <p className="text-xs" style={{ color: T.muted }}>
                  {repairDisplayText(routeResult.fromRoomName)} →{" "}
                  {repairDisplayText(routeResult.toRoomName)}
                </p>
                <p className="text-sm font-medium" style={{ color: T.text }}>
                  Tổng khoảng cách: {routeResult.totalDistance}
                </p>
                <ol className="max-h-40 space-y-1.5 overflow-y-auto text-xs" style={{ color: T.muted }}>
                  {routeResult.instructions.map((step) => (
                    <li key={`${step.stepIndex}-${step.waypointId}`}>
                      <span style={{ color: T.text }}>{step.stepIndex}.</span>{" "}
                      {repairDisplayText(step.instruction)}
                      {step.distance > 0 ? ` (${step.distance})` : ""}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {edges.length > 0 && (
            <div
              className="max-h-48 space-y-2 overflow-y-auto rounded-3xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <p className="text-xs font-medium" style={{ color: T.muted }}>
                Edges
              </p>
              {edges.map((edge) => (
                <div
                  key={edge.id}
                  className="flex items-center justify-between gap-2 text-xs"
                  style={{ color: T.text }}
                >
                  <span className="truncate">
                    {edge.fromWaypointId.slice(0, 6)}… → {edge.toWaypointId.slice(0, 6)}…
                    {" · "}
                    {edge.distance}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteEdge(edge.id)}
                    className="shrink-0 rounded-lg p-1.5"
                    style={{ color: "#8B3A22" }}
                    title="Xóa edge"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
