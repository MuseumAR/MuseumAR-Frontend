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
  ArrowUpDown,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import type {
  MuseumMapDto,
  RoomDto,
  WaypointDto,
  WaypointEdgeDto,
  NavigationRouteResponseDto,
} from "@/types/api";
import { findNavigationRoute, uniquePathFloors } from "@/lib/navigation-path";
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

  // All museum waypoints and edges are held in state to support cross-floor navigation
  const [waypoints, setWaypoints] = useState<WaypointDto[]>([]);
  const [edges, setEdges] = useState<WaypointEdgeDto[]>([]);
  const [loadedMapId, setLoadedMapId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map image failed state
  const [failedMapId, setFailedMapId] = useState<number | null>(null);
  const mapImgFailed = failedMapId === selectedMapId;

  // Connection mode state
  const [edgeStartWpId, setEdgeStartWpId] = useState<string | null>(null);

  // Selected waypoint state
  const [selectedWpId, setSelectedWpId] = useState<string | null>(null);

  // Cross-floor connection form state
  const [crossTargetWpId, setCrossTargetWpId] = useState<string>("");
  const [crossDistance, setCrossDistance] = useState<number>(3.0);

  // Waypoint creation form state
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

  const selectedFloor = currentMap?.floorNumber ?? 1;

  // Filter waypoints belonging to current floor plan
  const currentFloorWaypoints = useMemo(() => {
    if (!currentMap) return [];
    return waypoints.filter(
      (w) =>
        w.mapId === currentMap.id ||
        ((w.mapId == null || w.mapId === 0) && w.floorNumber === selectedFloor),
    );
  }, [waypoints, currentMap, selectedFloor]);

  // Filter edges where at least one node is on this floor
  const currentFloorEdges = useMemo(() => {
    const currentWpIds = new Set(currentFloorWaypoints.map((w) => String(w.id)));
    return edges.filter(
      (e) =>
        currentWpIds.has(String(e.fromWaypointId)) && currentWpIds.has(String(e.toWaypointId)),
    );
  }, [edges, currentFloorWaypoints]);

  const roomsOnSelectedMap = useMemo(
    () => rooms.filter((r) => r.mapId === selectedMapId),
    [rooms, selectedMapId],
  );

  const roomById = useMemo(() => {
    const map = new Map<number, RoomDto>();
    for (const room of rooms) map.set(room.id, room);
    return map;
  }, [rooms]);

  const isRoomWaypoint = (wp: Pick<WaypointDto, "waypointType">) => {
    const type = String(wp.waypointType ?? "").toUpperCase();
    return type === "DOOR" || type === "ROOM";
  };

  const takenRoomIds = useMemo(() => {
    const ids = new Set<number>();
    for (const wp of waypoints) {
      if (!isRoomWaypoint(wp)) continue;
      if (wp.roomId != null && wp.roomId !== 0) ids.add(wp.roomId);
    }
    return ids;
  }, [waypoints]);

  const roomsAvailableToLink = useMemo(
    () => roomsOnSelectedMap.filter((r) => !takenRoomIds.has(r.id)),
    [roomsOnSelectedMap, takenRoomIds],
  );

  const getRoomLabel = (wp: WaypointDto) => {
    if (!isRoomWaypoint(wp)) return null;
    if (wp.roomId == null || wp.roomId === 0) {
      return wp.name?.trim() || "Phòng";
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
      w.mapId === currentMap.id ||
      ((w.mapId == null || w.mapId === 0) && w.floorNumber === selectedFloor);

    const segments: { from: WaypointDto; to: WaypointDto }[] = [];
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      if (onThisMap(from) && onThisMap(to)) {
        segments.push({ from, to });
      }
    }
    return segments;
  }, [testResult, currentMap, selectedFloor]);

  const instructionsOnFloor = useMemo(() => {
    if (!testResult?.instructions?.length || !currentMap) return [];
    const pathIdsOnMap = new Set(
      (testResult.pathWaypoints || [])
        .filter(
          (w) =>
            w.mapId === currentMap.id ||
            ((w.mapId == null || w.mapId === 0) && w.floorNumber === selectedFloor),
        )
        .map((w) => String(w.id)),
    );
    const floor = currentMap.floorNumber ?? 1;
    return testResult.instructions.filter(
      (inst) =>
        pathIdsOnMap.has(String(inst.waypointId)) ||
        inst.floorNumber === floor,
    );
  }, [testResult, currentMap, selectedFloor]);

  const resolveWaypoint = (waypointId: string | number) => {
    const id = String(waypointId);
    return (
      testResult?.pathWaypoints?.find((w) => String(w.id) === id) ||
      waypoints.find((w) => String(w.id) === id) ||
      null
    );
  };

  // Load all museum waypoints & edges so cross-floor linking works seamlessly
  useEffect(() => {
    if (!museumId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await getNavigationGraphByMuseum(museumId);
        if (cancelled) return;
        setWaypoints(data.waypoints || []);
        setEdges(data.edges || []);
        setLoadedMapId(selectedMapId);
      } catch (err) {
        if (!cancelled) {
          setError(
            getDisplayError(err, "Không thể tải đồ thị dẫn đường. API có thể không khả dụng."),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [museumId]);

  // Handle map click for adding waypoint
  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "add_waypoint" || !containerRef.current || !currentMap) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10;
    const yRatio = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10;

    if (wpType === "DOOR" && wpRoomId && takenRoomIds.has(wpRoomId)) {
      setError("Phòng này đã có điểm dẫn đường.");
      return;
    }

    setSaving(true);
    try {
      const linkedRoomId = wpType === "DOOR" ? wpRoomId || null : null;
      const newWp = await createWaypoint({
        mapId: currentMap.id,
        museumId: museumId,
        floorNumber: currentMap.floorNumber ?? 1,
        locationX: xRatio,
        locationY: yRatio,
        waypointType: wpType,
        roomId: linkedRoomId,
        name: wpName.trim() || undefined,
      });

      setWaypoints((prev) => [
        ...prev,
        {
          ...newWp,
          roomId: newWp.roomId ?? linkedRoomId,
          waypointType: newWp.waypointType || wpType,
        },
      ]);
      setWpName("");
      if (wpType === "DOOR") setWpRoomId(undefined);
    } catch (err) {
      setError("Không thể thêm điểm dẫn đường.");
    } finally {
      setSaving(false);
    }
  };

  // Handle waypoint click
  const handleWaypointClick = async (wp: WaypointDto, e: React.MouseEvent) => {
    if (mode === "add_waypoint") return;
    e.stopPropagation();

    if (mode === "select") {
      setSelectedWpId(wp.id);
      setCrossTargetWpId("");
    } else if (mode === "connect_edge") {
      if (!edgeStartWpId) {
        setEdgeStartWpId(wp.id);
      } else if (edgeStartWpId === wp.id) {
        setEdgeStartWpId(null);
      } else {
        // Connect startWp and target Wp (supports same floor and cross-floor)
        const startWp = waypoints.find((w) => w.id === edgeStartWpId);
        if (startWp) {
          const isStartRoom = isRoomWaypoint(startWp) || (startWp.roomId != null && startWp.roomId !== 0);
          const isTargetRoom = isRoomWaypoint(wp) || (wp.roomId != null && wp.roomId !== 0);

          if (isStartRoom && isTargetRoom) {
            setError(
              "Không thể nối trực tiếp giữa hai phòng. Tuyến đường phải đi qua điểm hành lang (Hallway), sảnh (Lobby) hoặc cầu thang (Stairs)."
            );
            setEdgeStartWpId(null);
            return;
          }

          const isCrossFloor = startWp.floorNumber !== wp.floorNumber;
          const dx = wp.locationX - startWp.locationX;
          const dy = wp.locationY - startWp.locationY;
          const dist = isCrossFloor
            ? 3.0
            : Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10 || 1.0;

          const edgeType =
            startWp.waypointType === "ELEVATOR" || wp.waypointType === "ELEVATOR"
              ? "ELEVATOR"
              : isCrossFloor
              ? "STAIR"
              : "WALK";

          setSaving(true);
          try {
            const newEdge = await createEdge({
              museumId: museumId,
              fromWaypointId: edgeStartWpId,
              toWaypointId: wp.id,
              distance: dist > 0 ? dist : 1.0,
              edgeType: edgeType,
              isBidirectional: true,
            });
            setEdges((prev) => [...prev, newEdge]);
          } catch (err) {
            setError(getDisplayError(err, "Không thể nối các điểm."));
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
      setError("Không thể xóa điểm dẫn đường.");
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
      setError("Không thể xóa cạnh nối.");
    } finally {
      setSaving(false);
    }
  };

  // Selected Waypoint & Cross-floor analysis
  const selectedWp = useMemo(
    () => (selectedWpId ? waypoints.find((w) => w.id === selectedWpId) : null),
    [waypoints, selectedWpId]
  );

  const isSelectedWpTransit = useMemo(() => {
    if (!selectedWp) return false;
    const type = String(selectedWp.waypointType ?? "").toUpperCase();
    return type === "STAIR" || type === "STAIRS" || type === "ELEVATOR";
  }, [selectedWp]);

  // Other floor Stair/Elevator waypoints available for linking
  const crossStairOptions = useMemo(() => {
    if (!selectedWp || !isSelectedWpTransit) return [];
    return waypoints.filter(
      (w) =>
        w.id !== selectedWp.id &&
        (String(w.waypointType ?? "").toUpperCase() === "STAIR" ||
          String(w.waypointType ?? "").toUpperCase() === "STAIRS" ||
          String(w.waypointType ?? "").toUpperCase() === "ELEVATOR") &&
        (w.floorNumber !== selectedWp.floorNumber || (w.mapId && w.mapId !== selectedWp.mapId))
    );
  }, [waypoints, selectedWp, isSelectedWpTransit]);

  // Existing cross-floor connections for the selected waypoint
  const existingCrossFloorConnections = useMemo(() => {
    if (!selectedWp) return [];
    return edges
      .filter(
        (e) => String(e.fromWaypointId) === String(selectedWp.id) || String(e.toWaypointId) === String(selectedWp.id)
      )
      .map((e) => {
        const otherWpId =
          String(e.fromWaypointId) === String(selectedWp.id) ? e.toWaypointId : e.fromWaypointId;
        const otherWp = waypoints.find((w) => String(w.id) === String(otherWpId));
        return {
          edge: e,
          otherWp,
        };
      })
      .filter(
        (item) =>
          item.otherWp &&
          (item.otherWp.floorNumber !== selectedWp.floorNumber ||
            item.edge.edgeType === "STAIR" ||
            item.edge.edgeType === "ELEVATOR")
      );
  }, [edges, waypoints, selectedWp]);

  // Quick connect cross-floor handler (Method 1)
  const handleConnectCrossFloor = async () => {
    if (!selectedWp || !crossTargetWpId) return;
    const targetWp = waypoints.find((w) => w.id === crossTargetWpId);
    if (!targetWp) return;

    setSaving(true);
    try {
      const isElevator =
        selectedWp.waypointType === "ELEVATOR" || targetWp.waypointType === "ELEVATOR";
      const newEdge = await createEdge({
        museumId: museumId,
        fromWaypointId: selectedWp.id,
        toWaypointId: targetWp.id,
        distance: crossDistance > 0 ? crossDistance : 3.0,
        edgeType: isElevator ? "ELEVATOR" : "STAIR",
        isBidirectional: true,
      });
      setEdges((prev) => [...prev, newEdge]);
      setCrossTargetWpId("");
    } catch (err) {
      setError(getDisplayError(err, "Không thể kết nối liên tầng. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  const pathFloors = useMemo(
    () => uniquePathFloors(testResult?.pathWaypoints ?? []),
    [testResult],
  );

  const jumpToPathMap = (path: WaypointDto[]) => {
    if (path.some((w) => w.mapId === selectedMapId)) return;

    const first = path[0];
    if (!first) return;

    if (first.mapId && first.mapId !== 0 && maps.some((m) => m.id === first.mapId)) {
      setSelectedMapId(first.mapId);
      return;
    }

    const floor = first.floorNumber;
    if (floor == null) return;
    const current = maps.find((m) => m.id === selectedMapId);
    if ((current?.floorNumber ?? 1) === floor) return;
    const mapForFloor = maps.find((m) => (m.floorNumber ?? 1) === floor);
    if (mapForFloor) setSelectedMapId(mapForFloor.id);
  };

  const jumpToFloor = (floorNumber: number) => {
    const bySelected = maps.find(
      (m) =>
        (m.floorNumber ?? 1) === floorNumber &&
        (testResult?.pathWaypoints ?? []).some((w) => w.mapId === m.id),
    );
    const mapForFloor = bySelected ?? maps.find((m) => (m.floorNumber ?? 1) === floorNumber);
    if (mapForFloor) setSelectedMapId(mapForFloor.id);
  };

  // Run Test Route Navigation
  const handleRunTest = async () => {
    if (!testFromRoomId || !testToRoomId) return;
    if (Number(testFromRoomId) === Number(testToRoomId)) {
      setError("Chọn hai phòng khác nhau.");
      return;
    }
    setTestingPath(true);
    setTestResult(null);
    setActiveStepIndex(null);
    try {
      const fromId = Number(testFromRoomId);
      const toId = Number(testToRoomId);
      const local = findNavigationRoute({
        waypoints,
        edges,
        rooms,
        fromRoomId: fromId,
        toRoomId: toId,
      });
      const res = local ?? (await navigateRoute(fromId, toId));
      const path = res?.pathWaypoints ?? [];
      if (!res || path.length === 0) {
        setError(
          res?.instructions?.[0]?.instruction || "Không tìm thấy đường đi giữa hai phòng.",
        );
        return;
      }
      setTestResult(res);
      setActiveStepIndex(res.instructions[0]?.stepIndex ?? null);
      jumpToPathMap(path);
    } catch (err) {
      setError("Không thể chạy đường thử.");
    } finally {
      setTestingPath(false);
    }
  };

  const handleClearTest = () => {
    setTestResult(null);
    setActiveStepIndex(null);
  };

  const handleSelectStep = (stepIndex: number, floorNumber: number, waypointId?: string) => {
    setActiveStepIndex(stepIndex);
    const wp = waypointId ? resolveWaypoint(waypointId) : null;
    if (wp?.mapId && maps.some((m) => m.id === wp.mapId)) {
      if (wp.mapId !== selectedMapId) setSelectedMapId(wp.mapId);
      return;
    }
    const current = maps.find((m) => m.id === selectedMapId);
    if ((current?.floorNumber ?? 1) === floorNumber) return;
    const mapForFloor = maps.find((m) => (m.floorNumber ?? 1) === floorNumber);
    if (mapForFloor) setSelectedMapId(mapForFloor.id);
  };

  const getWpColor = (wp: Pick<WaypointDto, "waypointType" | "roomId"> | string) => {
    const type = typeof wp === "string" ? wp : wp.waypointType;
    const isRoomPoint = typeof wp === "string"
      ? type === "DOOR" || type === "ROOM"
      : isRoomWaypoint(wp);

    if (isRoomPoint) return "#16A34A"; // green

    switch (type) {
      case "STAIR":
      case "STAIRS":
        return "#EA580C"; // orange - stairs
      case "ELEVATOR":
        return "#7C3AED"; // purple - elevator
      case "LOBBY":
        return "#DB2777"; // pink - lobby
      case "HALLWAY":
      default:
        return "#2563EB"; // blue - hallway
    }
  };

  const startWpConnecting = useMemo(() => {
    if (!edgeStartWpId) return null;
    return waypoints.find((w) => w.id === edgeStartWpId) || null;
  }, [waypoints, edgeStartWpId]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(200,155,69,0.15)", color: T.primaryDark }}>
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className={dashboardTitleClass} style={{ fontFamily: cinzel, color: T.text }}>
              Đồ thị dẫn đường
            </h3>
            <p className="text-xs" style={{ color: T.muted }}>
              Đặt điểm và nối đường đi trên sơ đồ tầng
            </p>
          </div>
        </div>

        {/* Map Floor Selector */}
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: T.muted }} />
          <select
            value={selectedMapId}
            onChange={(e) => setSelectedMapId(Number(e.target.value))}
            className="rounded-xl px-3 py-1.5 text-sm font-medium outline-none shadow-sm"
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
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm shadow-sm" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
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
          <div className="rounded-2xl p-4 space-y-3 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
              Công cụ chỉnh sửa
            </span>
            <div className="space-y-2">
              <button
                onClick={() => { setMode("select"); setEdgeStartWpId(null); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  mode === "select" ? "shadow-sm font-bold" : ""
                }`}
                style={{
                  background: mode === "select" ? T.primaryDark : "rgba(200,155,69,0.06)",
                  color: mode === "select" ? "white" : T.text,
                }}
              >
                <MapPin className="h-4 w-4" /> Chọn & xem
              </button>

              <button
                onClick={() => { setMode("add_waypoint"); setEdgeStartWpId(null); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  mode === "add_waypoint" ? "shadow-sm font-bold" : ""
                }`}
                style={{
                  background: mode === "add_waypoint" ? T.primaryDark : "rgba(200,155,69,0.06)",
                  color: mode === "add_waypoint" ? "white" : T.text,
                }}
              >
                <Plus className="h-4 w-4" /> Thêm điểm
              </button>

              <button
                onClick={() => { setMode("connect_edge"); setEdgeStartWpId(null); }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  mode === "connect_edge" ? "shadow-sm font-bold" : ""
                }`}
                style={{
                  background: mode === "connect_edge" ? T.primaryDark : "rgba(200,155,69,0.06)",
                  color: mode === "connect_edge" ? "white" : T.text,
                }}
              >
                <LinkIcon className="h-4 w-4" /> Nối đường
              </button>
            </div>

            {mode === "add_waypoint" && (
              <div className="pt-3 border-t space-y-3" style={{ borderColor: T.border }}>
                <span className="text-xs font-semibold" style={{ color: T.text }}>Loại điểm:</span>
                <select
                  value={wpType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setWpType(next);
                    if (next !== "DOOR") setWpRoomId(undefined);
                  }}
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
                    <span className="text-xs font-semibold" style={{ color: T.text }}>Gắn với phòng:</span>
                    {roomsAvailableToLink.length > 0 ? (
                      <select
                        value={wpRoomId || ""}
                        onChange={(e) => setWpRoomId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full rounded-xl px-3 py-1.5 text-xs font-medium border mt-1"
                        style={{ background: "white", borderColor: T.border }}
                      >
                        <option value="">-- Chọn phòng --</option>
                        {roomsAvailableToLink.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roomName} ({r.roomCode})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-[11px]" style={{ color: T.muted }}>
                        Tất cả phòng trên bản đồ này đã có điểm dẫn đường.
                      </p>
                    )}
                  </div>
                )}
                <p className="text-[11px] italic" style={{ color: T.muted }}>
                  👉 Nhấn vào sơ đồ tầng để đặt điểm mới.
                </p>
              </div>
            )}

            {mode === "connect_edge" && (
              <div className="pt-3 border-t text-xs space-y-2" style={{ borderColor: T.border, color: T.muted }}>
                {startWpConnecting ? (
                  <div className="rounded-xl p-2.5 text-xs space-y-1" style={{ background: "rgba(16,185,129,0.1)", color: "#065F46" }}>
                    <p className="font-bold flex items-center gap-1">
                      ✅ Đã chọn điểm bắt đầu:
                    </p>
                    <p className="text-[11px]">
                      {startWpConnecting.name || startWpConnecting.id} (Tầng {startWpConnecting.floorNumber})
                    </p>
                    <p className="text-[10px] text-emerald-700 italic">
                      👉 Nhấn điểm thứ 2 trên bản đồ này (hoặc đổi tầng để nối).
                    </p>
                    <button
                      onClick={() => setEdgeStartWpId(null)}
                      className="mt-1 text-[10px] font-bold text-red-600 underline"
                    >
                      Hủy chọn điểm này
                    </button>
                  </div>
                ) : (
                  <p>👉 Nhấn điểm thứ nhất, rồi nhấn điểm thứ hai để kết nối.</p>
                )}
                <p className="text-[11px] rounded-lg p-2 leading-relaxed" style={{ background: "rgba(200,155,69,0.08)", color: T.primaryDark }}>
                  ⚠️ <strong>Quy tắc nối:</strong> Không nối trực tiếp 2 phòng. Hãy nối qua điểm Hành lang (Hallway) hoặc Cầu thang (Stairs).
                </p>
              </div>
            )}
          </div>

          {/* Test Route Section */}
          <div className="rounded-2xl p-4 space-y-3 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
                Thử đường đi (A* Dijkstra)
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium" style={{ color: T.muted }}>Từ phòng:</label>
                <select
                  value={testFromRoomId}
                  onChange={(e) => setTestFromRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl px-3 py-1.5 text-xs border mt-0.5"
                  style={{ background: "white", borderColor: T.border }}
                >
                  <option value="">-- Chọn phòng (mọi tầng) --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomName} {r.floorNumber ? `(Tầng ${r.floorNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: T.muted }}>Đến phòng:</label>
                <select
                  value={testToRoomId}
                  onChange={(e) => setTestToRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl px-3 py-1.5 text-xs border mt-0.5"
                  style={{ background: "white", borderColor: T.border }}
                >
                  <option value="">-- Chọn điểm đến --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomName} {r.floorNumber ? `(Tầng ${r.floorNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunTest}
                disabled={!testFromRoomId || !testToRoomId || testingPath}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition disabled:opacity-50 shadow-sm"
                style={{ background: T.primaryDark }}
              >
                <Navigation className="h-3.5 w-3.5" />
                {testingPath ? "Đang tính..." : "Chạy thử lộ trình"}
              </button>
            </div>

            {testResult && (
              <div className="pt-3 border-t space-y-2 text-xs" style={{ borderColor: T.border }}>
                <div className="flex items-center justify-between font-bold" style={{ color: T.text }}>
                  <span>Khoảng cách: {testResult.totalDistance}m</span>
                  <span>{testResult.instructions.length} bước</span>
                </div>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  Đường vàng trên bản đồ = lộ trình trên tầng này. Nhấn một bước để nhảy tới điểm / tầng đó.
                </p>
                {pathFloors.length > 1 && (
                  <div className="rounded-xl p-2 space-y-1.5" style={{ background: "rgba(234,88,12,0.08)" }}>
                    <p className="text-[11px] font-semibold text-orange-800">
                      Đường đi qua {pathFloors.length} tầng: {pathFloors.map((f) => `T${f}`).join(" → ")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pathFloors.map((floor) => {
                        const active = (currentMap?.floorNumber ?? 1) === floor;
                        return (
                          <button
                            key={floor}
                            type="button"
                            onClick={() => jumpToFloor(floor)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              active ? "bg-orange-600 text-white" : "bg-white text-orange-800"
                            }`}
                          >
                            Tầng {floor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {testResult.instructions.map((inst, idx) => {
                    const isActive = activeStepIndex === inst.stepIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectStep(inst.stepIndex, inst.floorNumber, inst.waypointId)}
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
          {/* Color legend & Cross-floor connecting banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium" style={{ color: T.muted }}>
            <div className="flex flex-wrap items-center gap-3">
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

            {startWpConnecting && (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 animate-pulse">
                🔗 Đang nối từ: {startWpConnecting.name || startWpConnecting.id} (Tầng {startWpConnecting.floorNumber})
              </span>
            )}
          </div>

          <div
            ref={containerRef}
            onClick={handleMapClick}
            className={`relative min-h-[520px] w-full overflow-hidden rounded-2xl border shadow-inner ${
              mode === "add_waypoint" ? "cursor-crosshair" : "cursor-default"
            }`}
            style={{ background: "#F4F0E8", borderColor: T.border }}
          >
            {currentMap?.mapImageUrl && !mapImgFailed ? (
              <img
                src={currentMap.mapImageUrl}
                alt={currentMap.mapName || "Sơ đồ tầng"}
                className="h-full w-full object-contain pointer-events-none select-none"
                onError={() => setFailedMapId(selectedMapId)}
              />
            ) : (
              <div className="flex h-[520px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
                <MapPin className="h-8 w-8 text-amber-600/50" />
                <p className="font-semibold text-slate-700">{currentMap?.mapName || "Sơ đồ tầng"}</p>
                <p className="text-xs text-slate-400">
                  (Không tải được ảnh sơ đồ từ CDN. Vẫn có thể đặt điểm và nối đường trên khung bản đồ này.)
                </p>
              </div>
            )}

            {/* SVG overlay for drawing Edges & Highlighted Path */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {/* Base graph edges */}
              {currentFloorEdges.map((edge) => {
                const w1 = waypoints.find((w) => String(w.id) === String(edge.fromWaypointId));
                const w2 = waypoints.find((w) => String(w.id) === String(edge.toWaypointId));
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
                    strokeDasharray={edge.edgeType === "STAIR" || edge.edgeType === "ELEVATOR" ? "6,6" : "none"}
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
              const isRoomPoint = isRoomWaypoint(wp);
              const isTransitPoint =
                wp.waypointType === "STAIR" ||
                wp.waypointType === "STAIRS" ||
                wp.waypointType === "ELEVATOR";
              const path = testResult?.pathWaypoints ?? [];
              const pathIndex = path.findIndex((item) => String(item.id) === String(wp.id));
              const nextOnPath = pathIndex >= 0 ? path[pathIndex + 1] : undefined;
              const continuesOnOtherFloor =
                nextOnPath != null && nextOnPath.floorNumber !== wp.floorNumber;

              return (
                <div
                  key={wp.id}
                  onClick={(e) => handleWaypointClick(wp, e)}
                  style={{
                    left: `${wp.locationX}%`,
                    top: `${wp.locationY}%`,
                    zIndex: isRoomPoint || isTransitPoint || onPath ? 25 : 10,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex cursor-pointer flex-col items-center ${
                    testResult && !onPath ? "opacity-40" : ""
                  }`}
                  title={`${wp.name || wp.waypointType} (#${wp.id})${
                    roomLabel ? ` · ${roomLabel}` : ""
                  }${isPathStart ? " · Bắt đầu" : isPathEnd ? " · Kết thúc" : ""}`}
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
                  {isTransitPoint && (
                    <span className="mb-1 max-w-[110px] truncate rounded-md bg-orange-950/80 px-1 py-0.2 text-[9px] font-semibold text-white shadow-sm ring-1 ring-orange-400">
                      {wp.waypointType === "ELEVATOR" ? "🛗 Thang máy" : "🪜 Cầu thang"}
                    </span>
                  )}
                  {continuesOnOtherFloor && nextOnPath && (
                    <span className="mb-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                      {nextOnPath.floorNumber > wp.floorNumber ? "↑" : "↓"} Tầng {nextOnPath.floorNumber}
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
                          : isTransitPoint
                            ? "S"
                            : (wp.waypointType || "H")[0]}
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
                    handleSelectStep(inst.stepIndex, inst.floorNumber, inst.waypointId);
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

          {/* Selected Waypoint Details & Cross-Floor Quick Connect Panel */}
          {selectedWp && (
            <div className="rounded-2xl p-4 border space-y-3 shadow-sm" style={{ background: "white", borderColor: T.border }}>
              {/* Basic Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b pb-3" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-3">
                  <div
                    className="h-3.5 w-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: getWpColor(selectedWp) }}
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-800">
                      Điểm #{selectedWp.id}
                    </span>
                    <span className="ml-2.5 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {selectedWp.waypointType} (Tầng {selectedWp.floorNumber})
                    </span>
                    {selectedWp.roomId ? (
                      <span className="ml-2 font-medium text-emerald-700">
                        · Phòng #{selectedWp.roomId} ({roomById.get(selectedWp.roomId)?.roomName})
                      </span>
                    ) : null}
                    <span className="ml-2 text-slate-400">
                      · X: {selectedWp.locationX}%, Y: {selectedWp.locationY}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteWp(selectedWp.id)}
                    className="flex items-center gap-1 text-red-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa điểm này
                  </button>
                </div>
              </div>

              {/* Special Transit / Cross-Floor Connection Section */}
              {isSelectedWpTransit && (
                <div className="rounded-xl p-3.5 space-y-3 text-xs" style={{ background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.2)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-orange-900">
                      <ArrowUpDown className="h-4 w-4 text-orange-600" />
                      <span>Kết nối cầu thang / thang máy liên tầng (Cross-floor connection)</span>
                    </div>
                    <span className="text-[11px] text-orange-700 font-medium">
                      Điểm hiện tại: <strong>Tầng {selectedWp.floorNumber}</strong>
                    </span>
                  </div>

                  {/* Connect Dropdown & Action Form */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Nối sang tầng khác:
                    </label>
                    <select
                      value={crossTargetWpId}
                      onChange={(e) => setCrossTargetWpId(e.target.value)}
                      className="flex-1 min-w-[200px] rounded-xl px-3 py-1.5 text-xs font-medium border bg-white outline-none shadow-sm"
                      style={{ borderColor: T.border }}
                    >
                      <option value="">-- Chọn điểm Cầu thang / Thang máy ở tầng khác --</option>
                      {crossStairOptions.map((w) => (
                        <option key={w.id} value={w.id}>
                          [Tầng {w.floorNumber}] {w.name || w.code || `Điểm #${w.id}`} ({w.waypointType})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[11px]">Khoảng cách:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        step="0.5"
                        value={crossDistance}
                        onChange={(e) => setCrossDistance(Number(e.target.value))}
                        className="w-16 rounded-xl px-2 py-1 text-xs border text-center font-medium bg-white"
                        style={{ borderColor: T.border }}
                        title="Độ dài / chi phí leo cầu thang (mét)"
                      />
                      <span className="text-slate-500 text-[11px]">m</span>
                    </div>

                    <button
                      onClick={handleConnectCrossFloor}
                      disabled={!crossTargetWpId || saving}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-sm"
                      style={{ background: "#EA580C" }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {saving ? "Đang nối..." : "Nối liên tầng"}
                    </button>
                  </div>

                  {crossStairOptions.length === 0 && (
                    <p className="text-[11px] text-orange-800/80 italic">
                      💡 Chưa có điểm Cầu thang (STAIR) hoặc Thang máy (ELEVATOR) nào ở các tầng khác. Hãy tạo điểm Cầu thang ở các tầng còn lại để kết nối.
                    </p>
                  )}

                  {/* Existing Connected Stairs List */}
                  {existingCrossFloorConnections.length > 0 && (
                    <div className="pt-2 border-t border-orange-200/60 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700">
                        📋 Các tầng đang thông với điểm này:
                      </span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {existingCrossFloorConnections.map(({ edge, otherWp }) => (
                          <div
                            key={edge.id}
                            className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 text-xs border border-orange-200 shadow-sm"
                          >
                            <span className="font-semibold text-emerald-800">
                              ➔ Tầng {otherWp?.floorNumber ?? "?"} ({otherWp?.name || otherWp?.code || otherWp?.id})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              · {edge.edgeType} ({edge.distance}m)
                            </span>
                            <button
                              onClick={() => handleDeleteEdge(edge.id)}
                              className="text-red-500 hover:text-red-700 transition p-0.5"
                              title="Gỡ cạnh nối liên tầng này"
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
