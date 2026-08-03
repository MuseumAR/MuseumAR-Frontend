import type { ExhibitDto, RoomDto, TourRouteDto, TourRouteStopDto } from "@/types/api";
import type {
  EdgeConnectionData,
  MetroFlowEdge,
  PersistedRouteGraph,
  RoomFlowNode,
  RoomNodeData,
  RoomPublishStatus,
} from "./types";
import { applyMetroLayout } from "./layout";

const STORAGE_PREFIX = "museumar:route-graph:";

export function storageKey(museumId: number, routeId: number) {
  return `${STORAGE_PREFIX}${museumId}:${routeId}`;
}

export function loadPersistedGraph(
  museumId: number,
  routeId: number,
): PersistedRouteGraph | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(museumId, routeId));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedRouteGraph;
  } catch {
    return null;
  }
}

export function savePersistedGraph(museumId: number, graph: PersistedRouteGraph) {
  localStorage.setItem(storageKey(museumId, graph.routeId), JSON.stringify(graph));
}

export function roomStatusFromExhibits(
  roomId: number,
  exhibits: ExhibitDto[],
): RoomPublishStatus {
  const inRoom = exhibits.filter((e) => e.roomId === roomId);
  if (inRoom.length === 0) return "hidden";
  if (inRoom.some((e) => e.status?.toLowerCase() === "published")) return "published";
  if (inRoom.some((e) => e.status?.toLowerCase() === "hidden")) return "hidden";
  return "draft";
}

export function buildRoomNodeData(
  room: RoomDto,
  exhibits: ExhibitDto[],
  exhibitionLabel?: string,
): RoomNodeData {
  const artifactCount = exhibits.filter((e) => e.roomId === room.id).length;
  return {
    roomId: room.id,
    roomCode: room.roomCode,
    roomName: room.roomName,
    floorNumber: room.floorNumber,
    description: room.description,
    artifactCount,
    status: roomStatusFromExhibits(room.id, exhibits),
    exhibitionLabel,
  };
}

function roomNodeId(roomId: number) {
  return `room-${roomId}`;
}

function edgeId(sourceRoomId: number, targetRoomId: number) {
  return `edge-${sourceRoomId}-${targetRoomId}`;
}

function defaultEdgeData(
  fromRoomId: number,
  toRoomId: number,
  fromFloor: number,
  toFloor: number,
): EdgeConnectionData {
  return {
    fromRoomId,
    toRoomId,
    walkingDistanceM: 25,
    estimatedMinutes: 2,
    direction: "one-way",
    accessible: true,
    description: "",
    crossFloor: fromFloor !== toFloor,
  };
}

/** Collapse consecutive stops that share a room into an ordered room path. */
export function orderedRoomsFromStops(
  stops: TourRouteStopDto[],
  rooms: RoomDto[],
): RoomDto[] {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const sorted = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
  const path: RoomDto[] = [];

  for (const stop of sorted) {
    let room: RoomDto | undefined;
    if (stop.roomId != null) room = byId.get(stop.roomId);
    if (!room && stop.roomCode) {
      room = rooms.find((r) => r.roomCode === stop.roomCode);
    }
    if (!room) continue;
    const last = path[path.length - 1];
    if (last && last.id === room.id) continue;
    path.push(room);
  }
  return path;
}

export function buildGraphFromRoute(
  route: TourRouteDto,
  rooms: RoomDto[],
  exhibits: ExhibitDto[],
  museumId: number,
): { nodes: RoomFlowNode[]; edges: MetroFlowEdge[] } {
  const persisted = loadPersistedGraph(museumId, route.id);
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const path = orderedRoomsFromStops(route.stops ?? [], rooms);

  // Prefer rooms already on the saved graph; otherwise use path; fallback all rooms with stops or all rooms
  let roomIds: number[] = [];
  if (persisted?.nodes?.length) {
    roomIds = persisted.nodes.map((n) => n.roomId).filter((id) => roomMap.has(id));
  }
  if (roomIds.length === 0) {
    roomIds = path.map((r) => r.id);
  }
  if (roomIds.length === 0) {
    // Seed with all museum rooms so the canvas isn't empty
    roomIds = rooms.map((r) => r.id);
  }

  let nodes: RoomFlowNode[] = roomIds.map((id, index) => {
    const room = roomMap.get(id)!;
    const saved = persisted?.nodes.find((n) => n.roomId === id);
    return {
      id: roomNodeId(id),
      type: "room",
      position: saved?.position ?? { x: 80 + (index % 4) * 260, y: 80 + Math.floor(index / 4) * 140 },
      data: buildRoomNodeData(room, exhibits, route.exhibitionName ?? undefined),
    };
  });

  let edges: MetroFlowEdge[] = [];

  if (persisted?.edges?.length) {
    edges = persisted.edges
      .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "metro",
        animated: false,
        data: e.data,
      }));
  } else if (path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      edges.push({
        id: edgeId(from.id, to.id),
        source: roomNodeId(from.id),
        target: roomNodeId(to.id),
        type: "metro",
        data: defaultEdgeData(from.id, to.id, from.floorNumber, to.floorNumber),
      });
    }
  }

  // Auto-layout when no saved positions
  if (!persisted?.nodes?.length && nodes.length > 0) {
    nodes = applyMetroLayout(nodes, edges);
  }

  return { nodes, edges };
}

export function createEdgeBetween(
  sourceNode: RoomFlowNode,
  targetNode: RoomFlowNode,
): MetroFlowEdge {
  const fromId = sourceNode.data.roomId;
  const toId = targetNode.data.roomId;
  return {
    id: edgeId(fromId, toId),
    source: sourceNode.id,
    target: targetNode.id,
    type: "metro",
    data: defaultEdgeData(
      fromId,
      toId,
      sourceNode.data.floorNumber,
      targetNode.data.floorNumber,
    ),
  };
}

export function uniqueFloors(rooms: RoomDto[]): number[] {
  const set = new Set(rooms.map((r) => r.floorNumber));
  return [...set].sort((a, b) => a - b);
}

export function summarizeGraph(nodes: RoomFlowNode[], edges: MetroFlowEdge[]) {
  const totalDistance = edges.reduce(
    (sum, e) => sum + (e.data?.walkingDistanceM ?? 0),
    0,
  );
  const totalMinutes = edges.reduce(
    (sum, e) => sum + (e.data?.estimatedMinutes ?? 0),
    0,
  );
  return {
    roomCount: nodes.length,
    connectionCount: edges.length,
    totalDistance,
    estimatedVisitMinutes: totalMinutes,
  };
}
