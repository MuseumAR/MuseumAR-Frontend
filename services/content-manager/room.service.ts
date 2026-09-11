import {
  apiDeleteAuth,
  apiGet,
  apiPostAuth,
  apiPutAuth,
} from "@/services/api-client";
import { normalizeRoomDto, unwrapArray } from "@/lib/normalize-dto";
import type { CreateRoomDto, RoomDto, UpdateRoomDto } from "@/types/api";

export async function getRoomList(
  museumId: number,
  opts?: { mapId?: number },
): Promise<RoomDto[]> {
  const params = new URLSearchParams();
  if (opts?.mapId) params.set("mapId", String(opts.mapId));
  const qs = params.toString();
  const res = await apiGet<unknown>(
    `/api/Content/rooms/museum/${museumId}${qs ? `?${qs}` : ""}`,
  );
  return unwrapArray(res).map(normalizeRoomDto);
}

export function getRoomById(id: number) {
  return apiGet<unknown>(`/api/Content/rooms/${id}`).then(normalizeRoomDto);
}

export function createRoom(payload: CreateRoomDto) {
  return apiPostAuth<unknown>("/api/Content/rooms", payload).then(normalizeRoomDto);
}

export function updateRoom(id: number, payload: UpdateRoomDto) {
  return apiPutAuth<unknown>(`/api/Content/rooms/${id}`, payload).then(
    normalizeRoomDto,
  );
}

export function deleteRoom(id: number) {
  return apiDeleteAuth<null>(`/api/Content/rooms/${id}`);
}

export function roomDisplayName(room: RoomDto, lang = "vi"): string {
  if (lang === "en") {
    const en = room.translations?.find((t) => t.languageCode === "en");
    return en?.roomName || room.roomNameEn || room.roomName;
  }
  return room.roomName;
}
