import {
  apiDeleteAuth,
  apiGet,
  apiPostAuth,
  apiPutAuth,
} from "@/services/api-client";
import { withCorrectedNavigationInstructions } from "@/lib/navigation-instructions";
import type {
  CreateWaypointDto,
  CreateWaypointEdgeDto,
  NavigationGraphDto,
  NavigationRouteResponseDto,
  UpdateWaypointDto,
  WaypointDto,
  WaypointEdgeDto,
} from "@/types/api";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeWaypoint(raw: unknown): WaypointDto {
  const o = asRecord(raw);
  return {
    id: String(o.id ?? o.Id ?? ""),
    museumId: Number(o.museumId ?? o.MuseumId ?? 0),
    mapId: Number(o.mapId ?? o.MapId ?? 0),
    floorNumber: Number(o.floorNumber ?? o.FloorNumber ?? 1),
    locationX: Number(o.locationX ?? o.LocationX ?? 0),
    locationY: Number(o.locationY ?? o.LocationY ?? 0),
    waypointType: String(o.waypointType ?? o.WaypointType ?? "HALLWAY"),
    roomId:
      o.roomId != null || o.RoomId != null
        ? Number(o.roomId ?? o.RoomId)
        : null,
    code: (o.code ?? o.Code) as string | null | undefined,
    name: (o.name ?? o.Name) as string | null | undefined,
    createdAt: (o.createdAt ?? o.CreatedAt) as string | undefined,
    updatedAt: (o.updatedAt ?? o.UpdatedAt) as string | undefined,
  };
}

function normalizeEdge(raw: unknown): WaypointEdgeDto {
  const o = asRecord(raw);
  return {
    id: Number(o.id ?? o.Id ?? 0),
    museumId: Number(o.museumId ?? o.MuseumId ?? 0),
    fromWaypointId: String(o.fromWaypointId ?? o.FromWaypointId ?? ""),
    toWaypointId: String(o.toWaypointId ?? o.ToWaypointId ?? ""),
    distance: Number(o.distance ?? o.Distance ?? 0),
    edgeType: String(o.edgeType ?? o.EdgeType ?? "WALK"),
    isBidirectional: Boolean(o.isBidirectional ?? o.IsBidirectional ?? true),
    createdAt: (o.createdAt ?? o.CreatedAt) as string | undefined,
  };
}

function normalizeGraph(raw: unknown): NavigationGraphDto {
  const o = asRecord(raw);
  const waypoints = o.waypoints ?? o.Waypoints;
  const edges = o.edges ?? o.Edges;
  return {
    museumId: Number(o.museumId ?? o.MuseumId ?? 0),
    waypoints: (Array.isArray(waypoints) ? waypoints : []).map(normalizeWaypoint),
    edges: (Array.isArray(edges) ? edges : []).map(normalizeEdge),
  };
}

function normalizeRoute(raw: unknown): NavigationRouteResponseDto {
  const o = asRecord(raw);
  const path = o.pathWaypoints ?? o.PathWaypoints;
  const instructions = o.instructions ?? o.Instructions;
  const route: NavigationRouteResponseDto = {
    fromRoomId: Number(o.fromRoomId ?? o.FromRoomId ?? 0),
    fromRoomName: String(o.fromRoomName ?? o.FromRoomName ?? ""),
    toRoomId: Number(o.toRoomId ?? o.ToRoomId ?? 0),
    toRoomName: String(o.toRoomName ?? o.ToRoomName ?? ""),
    totalDistance: Number(o.totalDistance ?? o.TotalDistance ?? 0),
    pathWaypoints: (Array.isArray(path) ? path : []).map(normalizeWaypoint),
    instructions: (Array.isArray(instructions) ? instructions : []).map((item) => {
      const i = asRecord(item);
      return {
        stepIndex: Number(i.stepIndex ?? i.StepIndex ?? 0),
        instruction: String(i.instruction ?? i.Instruction ?? ""),
        action: String(i.action ?? i.Action ?? "STRAIGHT"),
        distance: Number(i.distance ?? i.Distance ?? 0),
        floorNumber: Number(i.floorNumber ?? i.FloorNumber ?? 1),
        waypointId: String(i.waypointId ?? i.WaypointId ?? ""),
      };
    }),
  };
  // Temporary: rebuild turns with real angle until BE fixes |cross| > 10.
  return withCorrectedNavigationInstructions(route);
}

export function getMuseumNavigationGraph(
  museumId: number,
): Promise<NavigationGraphDto> {
  return apiGet<unknown>(`/api/Navigation/museum/${museumId}/graph`).then(
    normalizeGraph,
  );
}

export function getMapNavigationGraph(mapId: number): Promise<NavigationGraphDto> {
  return apiGet<unknown>(`/api/Navigation/map/${mapId}/graph`).then(normalizeGraph);
}

export function createWaypoint(payload: CreateWaypointDto): Promise<WaypointDto> {
  return apiPostAuth<unknown>("/api/Navigation/waypoints", payload).then(
    normalizeWaypoint,
  );
}

export function updateWaypoint(
  id: string,
  payload: UpdateWaypointDto,
): Promise<WaypointDto> {
  return apiPutAuth<unknown>(
    `/api/Navigation/waypoints/${encodeURIComponent(id)}`,
    payload,
  ).then(normalizeWaypoint);
}

export function deleteWaypoint(id: string): Promise<void> {
  return apiDeleteAuth(`/api/Navigation/waypoints/${encodeURIComponent(id)}`);
}

export function createWaypointEdge(
  payload: CreateWaypointEdgeDto,
): Promise<WaypointEdgeDto> {
  return apiPostAuth<unknown>("/api/Navigation/edges", payload).then(normalizeEdge);
}

export function deleteWaypointEdge(id: number): Promise<void> {
  return apiDeleteAuth(`/api/Navigation/edges/${id}`);
}

export function navigateBetweenRooms(
  fromRoomId: number,
  toRoomId: number,
): Promise<NavigationRouteResponseDto> {
  const params = new URLSearchParams({
    fromRoomId: String(fromRoomId),
    toRoomId: String(toRoomId),
  });
  return apiGet<unknown>(`/api/Navigation/route?${params.toString()}`).then(
    normalizeRoute,
  );
}
