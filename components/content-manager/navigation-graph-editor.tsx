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
  getNavigationGraphByMuseum,
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

  const containerRef = useRef<HTMLDivElement>(null);

  const currentMap = useMemo(
    () => maps.find((m) => m.id === selectedMapId) ?? maps[0],
    [maps, selectedMapId]
  );

  const currentFloorWaypoints = useMemo(
    () => waypoints.filter((w) => currentMap && (w.floorNumber === currentMap.floorNumber || w.museumId === museumId)),
    [waypoints, currentMap, museumId]
  );

  const currentFloorEdges = useMemo(() => {
    const currentWpIds = new Set(currentFloorWaypoints.map((w) => w.id));
    return edges.filter((e) => currentWpIds.has(e.fromWaypointId) || currentWpIds.has(e.toWaypointId));
  }, [edges, currentFloorWaypoints]);

  useEffect(() => {
    setMapImgFailed(false);
  }, [selectedMapId]);

  // Load graph on mount & map change
  useEffect(() => {
    if (!museumId) return;
    setLoading(true);
    getNavigationGraphByMuseum(museumId)
      .then((data) => {
        setWaypoints(data.waypoints || []);
        setEdges(data.edges || []);
      })
      .catch((err) => setError("Không thể tải đồ thị chỉ đường."))
      .finally(() => setLoading(false));
  }, [museumId]);

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
      setError("Không thể xóa Waypoint.");
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
      setError("Không thể xóa Edge.");
    } finally {
      setSaving(false);
    }
  };

  // Run Test Route Navigation
  const handleRunTest = async () => {
    if (!testFromRoomId || !testToRoomId) return;
    setTestingPath(true);
    setTestResult(null);
    try {
      const res = await navigateRoute(Number(testFromRoomId), Number(testToRoomId));
      setTestResult(res);
    } catch (err) {
      setError("Lỗi khi chạy thử đường dẫn.");
    } finally {
      setTestingPath(false);
    }
  };

  const getWpColor = (type: string) => {
    switch (type) {
      case "DOOR":
        return "#10B981"; // green
      case "STAIR":
        return "#F59E0B"; // orange
      case "ELEVATOR":
        return "#8B5CF6"; // purple
      case "LOBBY":
        return "#EC4899"; // pink
      default:
        return "#3B82F6"; // blue
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
              Navigation Graph Editor
            </h3>
            <p className="text-xs" style={{ color: T.muted }}>
              Chấm các nốt chỉ đường (Waypoint) và nối đường di chuyển (Edge) trên sơ đồ mặt bằng
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
                {m.mapName || `Floor ${m.floorNumber ?? 1}`}
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
              Công cụ Editor
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
                <Plus className="h-4 w-4" /> Thêm Nốt Waypoint
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
                <LinkIcon className="h-4 w-4" /> Nối Đường Edge
              </button>
            </div>

            {mode === "add_waypoint" && (
              <div className="pt-3 border-t space-y-3" style={{ borderColor: T.border }}>
                <span className="text-xs font-semibold" style={{ color: T.text }}>Loại Waypoint:</span>
                <select
                  value={wpType}
                  onChange={(e) => setWpType(e.target.value)}
                  className="w-full rounded-xl px-3 py-1.5 text-xs font-medium border"
                  style={{ background: "white", borderColor: T.border }}
                >
                  <option value="HALLWAY">Hành lang (Blue)</option>
                  <option value="DOOR">Cửa phòng (Green)</option>
                  <option value="STAIR">Cầu thang (Orange)</option>
                  <option value="ELEVATOR">Thang máy (Purple)</option>
                  <option value="LOBBY">Sảnh (Pink)</option>
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
                  👉 Click trực tiếp lên ảnh sơ đồ để thả nốt mới.
                </p>
              </div>
            )}

            {mode === "connect_edge" && (
              <div className="pt-3 border-t text-xs space-y-1.5" style={{ borderColor: T.border, color: T.muted }}>
                {edgeStartWpId ? (
                  <p className="font-semibold text-emerald-600">
                    ✅ Đã chọn Nốt #{edgeStartWpId}. Hãy click Nốt thứ 2 để tạo dây nối.
                  </p>
                ) : (
                  <p>👉 Click Nốt đầu tiên, sau đó click Nốt thứ hai để nối dây.</p>
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
                  <option value="">-- Pilih Room --</option>
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
                  <option value="">-- Pilih Room --</option>
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
                <div className="flex justify-between font-bold" style={{ color: T.text }}>
                  <span>Khoảng cách: {testResult.totalDistance}m</span>
                  <span>{testResult.instructions.length} bước</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {testResult.instructions.map((inst, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/70">
                      <span className="font-semibold text-amber-700">{inst.stepIndex}.</span>
                      <span className="text-slate-700">{inst.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Canvas Display */}
        <div className="space-y-4 lg:col-span-3">
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
                alt={currentMap.mapName || "Floor plan"}
                className="h-full w-full object-contain pointer-events-none select-none"
                onError={() => setMapImgFailed(true)}
              />
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
                <MapPin className="h-8 w-8 text-amber-600/50" />
                <p className="font-semibold text-slate-700">{currentMap?.mapName || "Bản đồ sơ đồ mặt bằng"}</p>
                <p className="text-xs text-slate-400">
                  (Ảnh sơ đồ demo chưa tải được từ CDN. Bạn vẫn có thể chấm nốt Waypoint và nối Edge trực tiếp lên khung bản đồ này)
                </p>
              </div>
            )}

            {/* SVG overlay for drawing Edges & Highlighted Path */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {/* Draw Edges */}
              {currentFloorEdges.map((edge) => {
                const w1 = waypoints.find((w) => w.id === edge.fromWaypointId);
                const w2 = waypoints.find((w) => w.id === edge.toWaypointId);
                if (!w1 || !w2) return null;

                return (
                  <line
                    key={edge.id}
                    x1={`${w1.locationX}%`}
                    y1={`${w1.locationY}%`}
                    x2={`${w2.locationX}%`}
                    y2={`${w2.locationY}%`}
                    stroke="#94A3B8"
                    strokeWidth="3"
                    strokeDasharray={edge.edgeType === "STAIR" ? "6,6" : "none"}
                  />
                );
              })}
            </svg>

            {/* Waypoint Dots */}
            {currentFloorWaypoints.map((wp) => {
              const isSelected = wp.id === selectedWpId;
              const isEdgeStart = wp.id === edgeStartWpId;

              return (
                <div
                  key={wp.id}
                  onClick={(e) => handleWaypointClick(wp, e)}
                  style={{
                    left: `${wp.locationX}%`,
                    top: `${wp.locationY}%`,
                    backgroundColor: getWpColor(wp.waypointType),
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition transform hover:scale-125 ${
                    isSelected ? "ring-4 ring-amber-400 scale-125" : ""
                  } ${isEdgeStart ? "ring-4 ring-emerald-400 animate-bounce" : ""}`}
                  title={`${wp.name || wp.waypointType} (#${wp.id})`}
                >
                  {wp.waypointType[0]}
                </div>
              );
            })}
          </div>

          {/* Selected Waypoint Details Card */}
          {selectedWpId && (
            <div className="flex items-center justify-between rounded-xl p-3 border text-xs" style={{ background: "white", borderColor: T.border }}>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getWpColor(waypoints.find((w) => w.id === selectedWpId)?.waypointType || "") }} />
                <div>
                  <span className="font-bold">Nốt #{selectedWpId}</span>
                  <span className="ml-2 text-slate-500">
                    ({waypoints.find((w) => w.id === selectedWpId)?.waypointType}) - X: {waypoints.find((w) => w.id === selectedWpId)?.locationX}%, Y: {waypoints.find((w) => w.id === selectedWpId)?.locationY}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteWp(selectedWpId)}
                className="flex items-center gap-1 text-red-600 font-semibold hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa Waypoint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
