import { apiDeleteAuth, apiGet, apiPostAuth, apiPutAuth } from "@/services/api-client";
import { safeFetch } from "@/lib/fetch-safe";
import type {
  CreateWaypointDto,
  CreateWaypointEdgeDto,
  NavigationGraphDto,
  NavigationRouteResponseDto,
  UpdateWaypointDto,
  WaypointDto,
  WaypointEdgeDto,
} from "@/types/api";

export async function getNavigationGraphByMuseum(museumId: number): Promise<NavigationGraphDto> {
  return safeFetch(
    () => apiGet<NavigationGraphDto>(`/api/Navigation/museum/${museumId}/graph`),
    { museumId, waypoints: [], edges: [] }
  );
}

export async function getNavigationGraphByMap(mapId: number): Promise<NavigationGraphDto> {
  return safeFetch(
    () => apiGet<NavigationGraphDto>(`/api/Navigation/map/${mapId}/graph`),
    { museumId: 0, waypoints: [], edges: [] }
  );
}

export async function createWaypoint(dto: CreateWaypointDto): Promise<WaypointDto> {
  return apiPostAuth<WaypointDto>("/api/Navigation/waypoints", dto);
}

export async function updateWaypoint(id: string, dto: UpdateWaypointDto): Promise<WaypointDto> {
  return apiPutAuth<WaypointDto>(`/api/Navigation/waypoints/${id}`, dto);
}

export async function deleteWaypoint(id: string): Promise<void> {
  return apiDeleteAuth(`/api/Navigation/waypoints/${id}`);
}

export async function createEdge(dto: CreateWaypointEdgeDto): Promise<WaypointEdgeDto> {
  return apiPostAuth<WaypointEdgeDto>("/api/Navigation/edges", dto);
}

export async function deleteEdge(id: number): Promise<void> {
  return apiDeleteAuth(`/api/Navigation/edges/${id}`);
}

export async function navigateRoute(fromRoomId: number, toRoomId: number): Promise<NavigationRouteResponseDto | null> {
  return safeFetch(
    () => apiGet<NavigationRouteResponseDto>(`/api/Navigation/route?fromRoomId=${fromRoomId}&toRoomId=${toRoomId}`),
    null
  );
}

export async function navigateTourRoute(tourRouteId: number): Promise<NavigationRouteResponseDto | null> {
  return safeFetch(
    () => apiGet<NavigationRouteResponseDto>(`/api/Navigation/tour-route/${tourRouteId}`),
    null
  );
}
