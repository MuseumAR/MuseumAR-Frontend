import {
  apiDeleteAuth,
  apiGet,
  apiPostAuth,
  apiPutAuth,
} from "@/services/api-client";
import { normalizeRoomDto } from "@/lib/normalize-dto";
import type { CreateRoomDto, RoomDto, UpdateRoomDto } from "@/types/api";

export async function getRoomList(museumId: number): Promise<RoomDto[]> {
  const res = await apiGet<unknown[]>(`/api/Content/rooms/museum/${museumId}`);
  if (Array.isArray(res)) {
    return res.map(normalizeRoomDto);
  }
  return [];
}

export function createRoom(payload: CreateRoomDto) {
  return apiPostAuth<RoomDto>("/api/Content/rooms", payload);
}

export function updateRoom(id: number, payload: UpdateRoomDto) {
  return apiPutAuth<RoomDto>(`/api/Content/rooms/${id}`, payload);
}

export function deleteRoom(id: number) {
  return apiDeleteAuth<null>(`/api/Content/rooms/${id}`);
}
