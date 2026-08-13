"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  MapPin,
  Footprints,
  Compass,
  Check,
  X,
  Navigation,
  ArrowRight,
  Sparkles,
  Layers,
  Link as LinkIcon,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type {
  MuseumMapDto,
  RoomDto,
  WaypointDto,
  WaypointEdgeDto,
  NavigationRouteResponseDto,
} from "@/types/api";
import {
  getNavigationGraphByMap,
  createWaypoint,
  deleteWaypoint,
  createEdge,
  deleteEdge,
  navigateRoute,
  updateWaypoint,
} from "@/services/content-manager/navigation.service";

interface NavigationGraphEditorProps {
  museumId: number;
  maps: MuseumMapDto[];
  rooms: RoomDto[];
}

type Mode = "select" | "add_waypoint" | "connect_edge";

export function NavigationGraphEditor({ museumId, maps, rooms }: NavigationGraphEditorProps) {
  const [selectedMapId, setSelectedMapId] = useState<number>(maps[0]?.id ?? 0);
  const [mode, setMode] = useState<Mode>("select");

  const [waypoints, setWaypoints] = useState<WaypointDto[]>([]);
  const [edges, setEdges] = useState<WaypointEdgeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map image failed state
  const [mapImgFailed, setMapImgFailed] = useState(false);

  // Connection mode state
  const [edgeStartWpId, setEdgeStartWpId] = useState<string | null>(null);

  // Selected waypoint state
  const [selectedWpId, setSelectedWpId] = useState<string | null>(null);

  // Waypoint form state
  const [wpType, setWpType] = useState<string>("HALLWAY");
  const [wpRoomId, setWpRoomId] = useState<number | undefined>(undefined);
  const [wpName, setWpName] = useState<string>("");

  // Test Route State
  const [testFromRoomId, setTestFromRoomId] = useState<number | "">("");
  const [testToRoomId, setTestToRoomId] = useState<number | "">("");
  const [testResult, setTestResult] = useState<NavigationRouteResponseDto | null>(null);
  const [testingPath, setTestingPath] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentMap = useMemo(
    () => maps.find((m) => m.id === selectedMapId) ?? maps[0],
    [maps, selectedMapId]
  );

  const currentFloorWaypoints = useMemo(() => {
    if (!currentMap) return [];
    // BE graph-by-map returns only waypoints with MapId == mapId
    return waypoints.filter(
      (w) => w.mapId == null || w.mapId === 0 || w.mapId === currentMap.id,
    );
  }, [waypoints, currentMap]);

  const currentFloorEdges = useMemo(() => {
    const currentWpIds = new Set(currentFloorWaypoints.map((w) => w.id));
    return edges.filter((e) => currentWpIds.has(e.fromWaypointId) || currentWpIds.has(e.toWaypointId));
  }, [edges, currentFloorWaypoints]);

  const roomById = useMemo(() => {
    const map = new Map<number, RoomDto>();
    for (const room of rooms) map.set(room.id, room);
    return map;
  }, [rooms]);

  const getRoomLabel = (wp: WaypointDto) => {
    if (wp.roomId == null || wp.roomId === 0) {
      if (wp.waypointType === "DOOR" || wp.waypointType === "ROOM") {
        return wp.name?.trim() || "Phòng";
      }
      return null;
    }
    const room = roomById.get(wp.roomId);
    if (room) {
      return room.roomCode ? `${room.roomName} (${room.roomCode})` : room.roomName;
    }
    return wp.name?.trim() || `Phòng #${wp.roomId}`;
  };

  const pathWaypointIds = useMemo(() => {
    if (!testResult?.pathWaypoints?.length) return new Set<string>();
    return new Set(testResult.pathWaypoints.map((w) => String(w.id)));
  }, [testResult]);

  /** Consecutive path segments on the loaded map graph. */
  const highlightedPathSegments = useMemo(() => {
    const path = testResult?.pathWaypoints;
    if (!path?.length || !currentMap) return [];

    const onThisMap = (w: WaypointDto) =>
      w.mapId == null || w.mapId === 0 || w.mapId === currentMap.id;

    const segments: { from: WaypointDto; to: WaypointDto }[] = [];
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      if (onThisMap(from) && onThisMap(to)) {
        segments.push({ from, to });
      }
    }
    return segments;
  }, [testResult, currentMap]);

  const instructionsOnFloor = useMemo(() => {
    if (!testResult?.instructions?.length || !currentMap) return [];
    const pathIdsOnMap = new Set(
      (testResult.pathWaypoints || [])
        .filter(
          (w) => w.mapId == null || w.mapId === 0 || w.mapId === currentMap.id,
        )
        .map((w) => String(w.id)),
    );
    const floor = currentMap.floorNumber ?? 1;
    return testResult.instructions.filter(
      (inst) =>
        pathIdsOnMap.has(String(inst.waypointId)) ||
        inst.floorNumber === floor,
    );
  }, [testResult, currentMap]);

  const resolveWaypoint = (waypointId: string | number) => {
    const id = String(waypointId);
    return (
      testResult?.pathWaypoints?.find((w) => String(w.id) === id) ||
      waypoints.find((w) => String(w.id) === id) ||
      null
    );
  };

  useEffect(() => {
    setMapImgFailed(false);
  }, [selectedMapId]);

  // Load graph when selected map changes (scoped by MapId on BE)
  useEffect(() => {
    if (!selectedMapId) return;
    setLoading(true);
    setTestResult(null);
    setActiveStepIndex(null);
    setSelectedWpId(null);
    getNavigationGraphByMap(selectedMapId)
      .then((data) => {
        setWaypoints(data.waypoints || []);
        setEdges(data.edges || []);
      })
      .catch(() => setError("Không thể tải đồ thị chỉ đường."))
      .finally(() => setLoading(false));
  }, [selectedMapId]);

  // Handle map click for adding waypoint
  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "add_waypoint" || !containerRef.current || !currentMap) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10;
    const yRatio = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10;

    setSaving(true);
    try {
      const newWp = await createWaypoint({
        mapId: currentMap.id,
        museumId: museumId,
        floorNumber: currentMap.floorNumber ?? 1,
        locationX: xRatio,
        locationY: yRatio,
        waypointType: wpType,
        roomId: wpRoomId || null,
        name: wpName.trim() || undefined,
      });

      setWaypoints((prev) => [...prev, newWp]);
      setWpName("");
    } catch (err) {
      setError("Lỗi khi thêm điểm chỉ đường.");
    } finally {
      setSaving(false);
    }
  };

  // Handle waypoint click
  const handleWaypointClick = async (wp: WaypointDto, e: React.MouseEvent) => {
    e.stopPropagation();

    if (mode === "select") {
      setSelectedWpId(wp.id);
    } else if (mode === "connect_edge") {
      if (!edgeStartWpId) {
        setEdgeStartWpId(wp.id);
      } else if (edgeStartWpId !== wp.id) {
        // Connect startWp and target Wp
        const startWp = waypoints.find((w) => w.id === edgeStartWpId);
        if (startWp) {
          const dx = wp.locationX - startWp.locationX;
          const dy = wp.locationY - startWp.locationY;
          const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10;

          setSaving(true);
          try {
            const newEdge = await createEdge({
              museumId: museumId,
              fromWaypointId: edgeStartWpId,
              toWaypointId: wp.id,
              distance: dist > 0 ? dist : 1.0,
              edgeType: startWp.floorNumber !== wp.floorNumber ? "STAIR" : "WALK",
              isBidirectional: true,
            });
            setEdges((prev) => [...prev, newEdge]);
          } catch (err) {
            setError("Không thể nối nốt chỉ đường.");
          } finally {
            setSaving(false);
            setEdgeStartWpId(null);
          }
        }
      }
    }
  };

  // Delete selected waypoint
  const handleDeleteWp = async (id: string) => {
    setSaving(true);
    try {
      await deleteWaypoint(id);
      setWaypoints((prev) => prev.filter((w) => w.id !== id));
      setEdges((prev) => prev.filter((e) => e.fromWaypointId !== id && e.toWaypointId !== id));
      if (selectedWpId === id) setSelectedWpId(null);
    } catch (err) {
      setError("Không thể xóa điểm chỉ đường.");
    } finally {
      setSaving(false);
    }
  };

  // Delete edge
  const handleDeleteEdge = async (id: number) => {
    setSaving(true);
    try {
      await deleteEdge(id);
      setEdges((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError("Không thể xóa đường nối.");
    } finally {
      setSaving(false);
    }
  };

  // Run Test Route Navigation
  const handleRunTest = async () => {
    if (!testFromRoomId || !testToRoomId) return;
    setTestingPath(true);
    setTestResult(null);
    setActiveStepIndex(null);
    try {
      const res = await navigateRoute(Number(testFromRoomId), Number(testToRoomId));
      if (!res) {
        setError("Không tìm thấy đường đi giữa hai phòng.");
        return;
      }
      setTestResult(res);
      setActiveStepIndex(res.instructions[0]?.stepIndex ?? null);

      // Jump to the floor of the first path waypoint so the highlight is visible
      const firstFloor = res.pathWaypoints[0]?.floorNumber;
      if (firstFloor != null) {
        const mapForFloor = maps.find((m) => (m.floorNumber ?? 1) === firstFloor);
        if (mapForFloor) setSelectedMapId(mapForFloor.id);
      }
    } catch (err) {
      setError("Lỗi khi chạy thử đường dẫn.");
    } finally {
      setTestingPath(false);
    }
  };

  const handleClearTest = () => {
    setTestResult(null);
    setActiveStepIndex(null);
  };

  const handleSelectStep = (stepIndex: number, floorNumber: number) => {
    setActiveStepIndex(stepIndex);
    const mapForFloor = maps.find((m) => (m.floorNumber ?? 1) === floorNumber);
    if (mapForFloor && mapForFloor.id !== selectedMapId) {
      setSelectedMapId(mapForFloor.id);
    }
  };

  /** Phòng (DOOR / có roomId) vs hành lang — màu tách rõ trên bản đồ. */
  const getWpColor = (wp: Pick<WaypointDto, "waypointType" | "roomId"> | string) => {
    const type = typeof wp === "string" ? wp : wp.waypointType;
    const roomId = typeof wp === "string" ? null : wp.roomId;
    const isRoomPoint = type === "DOOR" || type === "ROOM" || (roomId != null && roomId !== 0);

    if (isRoomPoint) return "#16A34A"; // xanh lá — điểm phòng

    switch (type) {
      case "STAIR":
        return "#EA580C"; // cam — cầu thang
      case "ELEVATOR":
        return "#7C3AED"; // tím — thang máy
      case "LOBBY":
        return "#DB2777"; // hồng — sảnh
      case "HALLWAY":
      default:
        return "#2563EB"; // xanh dương — hành lang
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(200,155,69,0.15)", color: T.primaryDark }}>
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ fontFamily: cinzel, color: T.text }}>
              Đồ thị chỉ đường
            </h3>
            <p className="text-xs" style={{ color: T.muted }}>
              Chấm các nốt chỉ đường và nối đường di chuyển trên sơ đồ mặt bằng
            </p>
          </div>
        </div>

        {/* Map Floor Selector */}
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: T.muted }} />
          <select
            value={selectedMapId}
            onChange={(e) => setSelectedMapId(Number(e.target.value))}
            className="rounded-xl px-3 py-1.5 text-sm font-medium outline-none"
            style={{ background: "white", border: `1px solid ${T.border}`, color: T.text }}
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.mapName || `Tầng ${m.floorNumber ?? 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Canvas & Sidebar layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Toolbar & Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Mode Selector */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
              Công cụ chỉnh sửa
            </span>
            <div className="space-y-2">
              <button
                onClick={() => { setMode("select"); setEdgeStartWpId(null); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  mode === "select" ? "shadow-sm" : ""
                }`}
                style={{
                  background: mode === "select" ? T.primaryDark : "rgba(200,155,69,0.06)",
                  color: mode === "select" ? "white" : T.text,
                }}
              >
                <MapPin className="h-4 w-4" /> Chọn & Xem thông tin
              </button>

              <button
                onClick={() => { setMode("add_waypoint"); setEdgeStartWpId(null); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  mode === "add_waypoint" ? "shadow-sm" : ""
                }`}
                style={{
                  background: mode === "add_waypoint" ? T.primaryDark : "rgba(200,155,69,0.06)",
                  color: mode === "add_waypoint" ? "white" : T.text,
                }}
              >
                <Plus className="h-4 w-4" /> Thêm nốt chỉ đường
              </button>

              <button
                onClick={() => { setMode("connect_edge"); setEdgeStartWpId(null); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  mode === "connect_edge" ? "shadow-sm" : ""
                }`}
                style={{
                  background: mode === "connect_edge" ? T.primaryDark : "rgba(200,155,69,0.06)",
                  color: mode === "connect_edge" ? "white" : T.text,
                }}
              >
                <LinkIcon className="h-4 w-4" /> Nối đường đi
              </button>
            </div>

            {mode === "add_waypoint" && (
              <div className="pt-3 border-t space-y-3" style={{ borderColor: T.border }}>
                <span className="text-xs font-semibold" style={{ color: T.text }}>Loại điểm chỉ đường:</span>
                <select
                  value={wpType}
                  onChange={(e) => setWpType(e.target.value)}
                  className="w-full rounded-xl px-3 py-1.5 text-xs font-medium border"
                  style={{ background: "white", borderColor: T.border }}
                >
                  <option value="HALLWAY">Hành lang (xanh dương)</option>
                  <option value="DOOR">Cửa / Phòng (xanh lá)</option>
                  <option value="STAIR">Cầu thang (cam)</option>
                  <option value="ELEVATOR">Thang máy (tím)</option>
                  <option value="LOBBY">Sảnh (hồng)</option>
                </select>

                {wpType === "DOOR" && (
                  <div>
                    <span className="text-xs font-semibold" style={{ color: T.text }}>Gắn với Phòng:</span>
                    <select
                      value={wpRoomId || ""}
                      onChange={(e) => setWpRoomId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-xl px-3 py-1.5 text-xs font-medium border mt-1"
                      style={{ background: "white", borderColor: T.border }}
                    >
                      <option value="">-- Chọn phòng --</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roomName} ({r.roomCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-[11px] italic" style={{ color: T.muted }}>
                  👉 Nhấp trực tiếp lên ảnh sơ đồ để thả nốt mới.
                </p>
              </div>
            )}

            {mode === "connect_edge" && (
              <div className="pt-3 border-t text-xs space-y-1.5" style={{ borderColor: T.border, color: T.muted }}>
                {edgeStartWpId ? (
                  <p className="font-semibold text-emerald-600">
                    ✅ Đã chọn nốt #{edgeStartWpId}. Hãy nhấp nốt thứ 2 để tạo dây nối.
                  </p>
                ) : (
                  <p>👉 Nhấp nốt đầu tiên, sau đó nhấp nốt thứ hai để nối dây.</p>
                )}
              </div>
            )}
          </div>

          {/* Test Route Section */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
                Chạy Thử Đường Dẫn (A*)
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium" style={{ color: T.muted }}>Từ Phòng:</label>
                <select
                  value={testFromRoomId}
                  onChange={(e) => setTestFromRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl px-3 py-1.5 text-xs border mt-0.5"
                  style={{ background: "white", borderColor: T.border }}
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.roomName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: T.muted }}>Đến Phòng:</label>
                <select
                  value={testToRoomId}
                  onChange={(e) => setTestToRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl px-3 py-1.5 text-xs border mt-0.5"
                  style={{ background: "white", borderColor: T.border }}
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.roomName}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunTest}
                disabled={!testFromRoomId || !testToRoomId || testingPath}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition disabled:opacity-50"
                style={{ background: T.primaryDark }}
              >
                <Navigation className="h-3.5 w-3.5" />
                {testingPath ? "Đang tính..." : "Chạy Thử Tuyến Đường"}
              </button>
            </div>

            {testResult && (
              <div className="pt-3 border-t space-y-2 text-xs" style={{ borderColor: T.border }}>
                <div className="flex items-center justify-between font-bold" style={{ color: T.text }}>
                  <span>Khoảng cách: {testResult.totalDistance}m</span>
                  <span>{testResult.instructions.length} bước</span>
                </div>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  Đường vàng trên bản đồ = tuyến đi. Nhấp bước để nhảy tới vị trí chỉ đường.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {testResult.instructions.map((inst, idx) => {
                    const isActive = activeStepIndex === inst.stepIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectStep(inst.stepIndex, inst.floorNumber)}
                        className={`flex w-full items-start gap-1.5 rounded-lg p-1.5 text-left transition ${
                          isActive
                            ? "bg-amber-100 ring-1 ring-amber-400"
                            : "bg-white/70 hover:bg-amber-50"
                        }`}
                      >
                        <span className="font-semibold text-amber-700">{inst.stepIndex}.</span>
                        <span className="text-slate-700">
                          {inst.instruction}
                          {inst.action ? (
                            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-amber-600/80">
                              {inst.action}
                              {inst.distance > 0 ? ` · ${inst.distance}m` : ""}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleClearTest}
                  className="w-full rounded-xl py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-white/80"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  Xóa đường thử
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Canvas Display */}
        <div className="space-y-4 lg:col-span-3">
          {/* Color legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium" style={{ color: T.muted }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#16A34A" }} />
              Phòng / Cửa
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2563EB" }} />
              Hành lang
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#EA580C" }} />
              Cầu thang
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#7C3AED" }} />
              Thang máy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#DB2777" }} />
              Sảnh
            </span>
          </div>

          <div
            ref={containerRef}
            onClick={handleMapClick}
            className={`relative min-h-[500px] w-full overflow-hidden rounded-2xl border shadow-inner ${
              mode === "add_waypoint" ? "cursor-crosshair" : "cursor-default"
            }`}
            style={{ background: "#F4F0E8", borderColor: T.border }}
          >
            {currentMap?.mapImageUrl && !mapImgFailed ? (
              <img
                src={currentMap.mapImageUrl}
                alt={currentMap.mapName || "Sơ đồ tầng"}
                className="h-full w-full object-contain pointer-events-none select-none"
                onError={() => setMapImgFailed(true)}
              />
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
                <MapPin className="h-8 w-8 text-amber-600/50" />
                <p className="font-semibold text-slate-700">{currentMap?.mapName || "Bản đồ sơ đồ mặt bằng"}</p>
                <p className="text-xs text-slate-400">
                  (Ảnh sơ đồ demo chưa tải được từ CDN. Bạn vẫn có thể chấm nốt chỉ đường và nối đường đi trực tiếp lên khung bản đồ này)
                </p>
              </div>
            )}

            {/* SVG overlay for drawing Edges & Highlighted Path */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {/* Base graph edges */}
              {currentFloorEdges.map((edge) => {
                const w1 = waypoints.find((w) => w.id === edge.fromWaypointId);
                const w2 = waypoints.find((w) => w.id === edge.toWaypointId);
                if (!w1 || !w2) return null;

                const onPath =
                  pathWaypointIds.has(String(w1.id)) && pathWaypointIds.has(String(w2.id));

                return (
                  <line
                    key={edge.id}
                    x1={`${w1.locationX}%`}
                    y1={`${w1.locationY}%`}
                    x2={`${w2.locationX}%`}
                    y2={`${w2.locationY}%`}
                    stroke={onPath && testResult ? "#CBD5E1" : "#94A3B8"}
                    strokeWidth="3"
                    strokeDasharray={edge.edgeType === "STAIR" ? "6,6" : "none"}
                    opacity={testResult && !onPath ? 0.35 : 1}
                  />
                );
              })}

              {/* Highlighted A* path */}
              {highlightedPathSegments.map(({ from, to }, idx) => (
                <g key={`path-${from.id}-${to.id}-${idx}`}>
                  <line
                    x1={`${from.locationX}%`}
                    y1={`${from.locationY}%`}
                    x2={`${to.locationX}%`}
                    y2={`${to.locationY}%`}
                    stroke="#F59E0B"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity={0.35}
                  />
                  <line
                    x1={`${from.locationX}%`}
                    y1={`${from.locationY}%`}
                    x2={`${to.locationX}%`}
                    y2={`${to.locationY}%`}
                    stroke="#D97706"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </svg>

            {/* Waypoint Dots */}
            {currentFloorWaypoints.map((wp) => {
              const isSelected = wp.id === selectedWpId;
              const isEdgeStart = wp.id === edgeStartWpId;
              const onPath = pathWaypointIds.has(String(wp.id));
              const isPathStart =
                testResult?.pathWaypoints[0] &&
                String(testResult.pathWaypoints[0].id) === String(wp.id);
              const isPathEnd =
                testResult?.pathWaypoints.length &&
                String(testResult.pathWaypoints[testResult.pathWaypoints.length - 1].id) ===
                  String(wp.id);
              const roomLabel = getRoomLabel(wp);
              const isRoomPoint =
                wp.waypointType === "DOOR" ||
                wp.waypointType === "ROOM" ||
                (wp.roomId != null && wp.roomId !== 0);

              return (
                <div
                  key={wp.id}
                  onClick={(e) => handleWaypointClick(wp, e)}
                  style={{
                    left: `${wp.locationX}%`,
                    top: `${wp.locationY}%`,
                    zIndex: isRoomPoint || onPath ? 25 : 10,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex cursor-pointer flex-col items-center ${
                    testResult && !onPath ? "opacity-40" : ""
                  }`}
                  title={`${wp.name || wp.waypointType} (#${wp.id})${
                    roomLabel ? ` · ${roomLabel}` : ""
                  }${isPathStart ? " · Điểm bắt đầu" : isPathEnd ? " · Điểm kết thúc" : ""}`}
                >
                  {isRoomPoint && roomLabel && (
                    <span
                      className={`mb-1 max-w-[120px] truncate rounded-md px-1.5 py-0.5 text-center text-[10px] font-semibold leading-tight shadow-sm ring-1 ${
                        isSelected
                          ? "bg-emerald-700 text-white ring-emerald-800"
                          : "bg-white/95 text-emerald-800 ring-emerald-200"
                      }`}
                    >
                      {roomLabel}
                    </span>
                  )}
                  <span
                    style={{ backgroundColor: getWpColor(wp) }}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition transform hover:scale-125 ${
                      isSelected ? "ring-4 ring-amber-400 scale-125" : ""
                    } ${isEdgeStart ? "ring-4 ring-emerald-400 animate-bounce" : ""} ${
                      onPath && !isSelected && !isEdgeStart
                        ? "ring-2 ring-amber-500 scale-110"
                        : ""
                    }`}
                  >
                    {isPathStart
                      ? "A"
                      : isPathEnd
                        ? "B"
                        : isRoomPoint
                          ? "P"
                          : wp.waypointType[0]}
                  </span>
                </div>
              );
            })}

            {/* Turn-by-turn step markers on map */}
            {instructionsOnFloor.map((inst) => {
              const wp = resolveWaypoint(inst.waypointId);
              if (!wp) return null;
              const isActive = activeStepIndex === inst.stepIndex;

              return (
                <button
                  key={`step-${inst.stepIndex}-${inst.waypointId}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectStep(inst.stepIndex, inst.floorNumber);
                  }}
                  style={{
                    left: `${wp.locationX}%`,
                    top: `${wp.locationY}%`,
                    zIndex: isActive ? 40 : 30,
                  }}
                  className={`absolute -translate-x-1/2 translate-y-3 flex max-w-[140px] flex-col items-center gap-0.5 ${
                    isActive ? "" : "opacity-90"
                  }`}
                  title={inst.instruction}
                >
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow ${
                      isActive ? "bg-amber-600 scale-110" : "bg-slate-800"
                    }`}
                  >
                    {inst.stepIndex}
                  </span>
                  {isActive && (
                    <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight text-slate-800 shadow ring-1 ring-amber-300">
                      {inst.instruction}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Waypoint Details Card */}
          {selectedWpId && (
            <div className="flex items-center justify-between rounded-xl p-3 border text-xs" style={{ background: "white", borderColor: T.border }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: getWpColor(
                      waypoints.find((w) => w.id === selectedWpId) || "HALLWAY",
                    ),
                  }}
                />
                <div>
                  <span className="font-bold">Nốt #{selectedWpId}</span>
                  <span className="ml-2 text-slate-500">
                    ({waypoints.find((w) => w.id === selectedWpId)?.waypointType}
                    {waypoints.find((w) => w.id === selectedWpId)?.roomId
                      ? ` · Phòng #${waypoints.find((w) => w.id === selectedWpId)?.roomId}`
                      : ""}
                    ) - X: {waypoints.find((w) => w.id === selectedWpId)?.locationX}%, Y:{" "}
                    {waypoints.find((w) => w.id === selectedWpId)?.locationY}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteWp(selectedWpId)}
                className="flex items-center gap-1 text-red-600 font-semibold hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa điểm chỉ đường
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
