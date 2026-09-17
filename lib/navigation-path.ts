import type {
  NavigationInstructionDto,
  NavigationRouteResponseDto,
  RoomDto,
  WaypointDto,
  WaypointEdgeDto,
} from "@/types/api";

function isDoorOrRoom(wp: Pick<WaypointDto, "waypointType">) {
  const type = String(wp.waypointType ?? "").toUpperCase();
  return type === "DOOR" || type === "ROOM";
}

export function findRoomWaypoint(
  waypoints: WaypointDto[],
  rooms: RoomDto[],
  roomId: number,
): WaypointDto | null {
  const room = rooms.find((item) => item.id === roomId);
  if (room?.doorWaypointId) {
    const byDoor = waypoints.find((w) => String(w.id) === String(room.doorWaypointId));
    if (byDoor) return byDoor;
  }
  if (room?.waypointId) {
    const byWp = waypoints.find((w) => String(w.id) === String(room.waypointId));
    if (byWp) return byWp;
  }
  const linked = waypoints.filter((w) => w.roomId === roomId);
  return linked.find(isDoorOrRoom) ?? linked[0] ?? null;
}

function roomLabel(rooms: RoomDto[], roomId: number) {
  const room = rooms.find((item) => item.id === roomId);
  if (!room) return `Phòng #${roomId}`;
  return room.roomCode ? `${room.roomName} (${room.roomCode})` : room.roomName;
}

function dijkstra(
  waypoints: WaypointDto[],
  edges: WaypointEdgeDto[],
  startId: string,
  endId: string,
): { pathIds: string[]; distance: number } | null {
  const ids = new Set(waypoints.map((w) => String(w.id)));
  if (!ids.has(startId) || !ids.has(endId)) return null;

  const adj = new Map<string, Array<{ toId: string; dist: number }>>();
  for (const id of ids) adj.set(id, []);

  for (const edge of edges) {
    const from = String(edge.fromWaypointId);
    const to = String(edge.toWaypointId);
    if (!ids.has(from) || !ids.has(to)) continue;
    const dist = Number(edge.distance) > 0 ? Number(edge.distance) : 1;
    adj.get(from)!.push({ toId: to, dist });
    if (edge.isBidirectional !== false) {
      adj.get(to)!.push({ toId: from, dist });
    }
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  for (const id of ids) dist.set(id, Number.POSITIVE_INFINITY);
  dist.set(startId, 0);

  const remaining = new Set(ids);
  while (remaining.size > 0) {
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const id of remaining) {
      const d = dist.get(id) ?? Number.POSITIVE_INFINITY;
      if (d < best) {
        best = d;
        current = id;
      }
    }
    if (current == null || best === Number.POSITIVE_INFINITY) break;
    remaining.delete(current);
    if (current === endId) break;

    for (const neighbor of adj.get(current) ?? []) {
      const next = best + neighbor.dist;
      if (next < (dist.get(neighbor.toId) ?? Number.POSITIVE_INFINITY)) {
        dist.set(neighbor.toId, next);
        prev.set(neighbor.toId, current);
      }
    }
  }

  if ((dist.get(endId) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) {
    return null;
  }

  const pathIds: string[] = [];
  let cursor = endId;
  while (cursor !== startId) {
    pathIds.push(cursor);
    const parent = prev.get(cursor);
    if (!parent) return null;
    cursor = parent;
  }
  pathIds.push(startId);
  pathIds.reverse();
  return { pathIds, distance: dist.get(endId) ?? 0 };
}

function generateInstructions(
  path: WaypointDto[],
  fromRoomName: string,
  toRoomName: string,
): NavigationInstructionDto[] {
  if (!path.length) return [];

  const instructions: NavigationInstructionDto[] = [
    {
      stepIndex: 1,
      instruction: `Bắt đầu di chuyển từ ${fromRoomName}`,
      action: "STRAIGHT",
      distance: 0,
      floorNumber: path[0].floorNumber,
      waypointId: String(path[0].id),
    },
  ];

  let stepIndex = 2;
  for (let i = 0; i < path.length - 1; i++) {
    const w1 = path[i];
    const w2 = path[i + 1];
    const type = String(w2.waypointType ?? "").toUpperCase();

    if (w1.floorNumber !== w2.floorNumber) {
      const goingUp = w2.floorNumber > w1.floorNumber;
      const isElevator = type === "ELEVATOR" || String(w1.waypointType ?? "").toUpperCase() === "ELEVATOR";
      instructions.push({
        stepIndex: stepIndex++,
        instruction: isElevator
          ? `Đi thang máy ${goingUp ? "lên" : "xuống"} Tầng ${w2.floorNumber}`
          : `Đi cầu thang ${goingUp ? "lên" : "xuống"} Tầng ${w2.floorNumber}`,
        action: isElevator ? "ELEVATOR" : goingUp ? "STAIR_UP" : "STAIR_DOWN",
        distance: 1,
        floorNumber: w2.floorNumber,
        waypointId: String(w2.id),
      });
      continue;
    }

    let turnText = "Đi thẳng";
    let action = "STRAIGHT";
    if (i > 0 && path[i - 1].floorNumber === w1.floorNumber) {
      const w0 = path[i - 1];
      const v1x = w1.locationX - w0.locationX;
      const v1y = w1.locationY - w0.locationY;
      const v2x = w2.locationX - w1.locationX;
      const v2y = w2.locationY - w1.locationY;
      const cross = v1x * v2y - v1y * v2x;
      if (cross > 10) {
        turnText = "Rẽ phải";
        action = "TURN_RIGHT";
      } else if (cross < -10) {
        turnText = "Rẽ trái";
        action = "TURN_LEFT";
      }
    }

    const via =
      w2.name ||
      (isDoorOrRoom(w2) ? "cửa phòng" : "hành lang");
    const dx = w2.locationX - w1.locationX;
    const dy = w2.locationY - w1.locationY;
    instructions.push({
      stepIndex: stepIndex++,
      instruction: `${turnText} qua ${via}`,
      action,
      distance: Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10,
      floorNumber: w2.floorNumber,
      waypointId: String(w2.id),
    });
  }

  const last = path[path.length - 1];
  instructions.push({
    stepIndex: stepIndex,
    instruction: `Đã đến ${toRoomName}`,
    action: "ARRIVE",
    distance: 0,
    floorNumber: last.floorNumber,
    waypointId: String(last.id),
  });

  return instructions;
}

export function findNavigationRoute(input: {
  waypoints: WaypointDto[];
  edges: WaypointEdgeDto[];
  rooms: RoomDto[];
  fromRoomId: number;
  toRoomId: number;
}): NavigationRouteResponseDto | null {
  const startWp = findRoomWaypoint(input.waypoints, input.rooms, input.fromRoomId);
  const endWp = findRoomWaypoint(input.waypoints, input.rooms, input.toRoomId);
  if (!startWp || !endWp) return null;

  const fromRoomName = roomLabel(input.rooms, input.fromRoomId);
  const toRoomName = roomLabel(input.rooms, input.toRoomId);

  if (String(startWp.id) === String(endWp.id)) {
    return {
      fromRoomId: input.fromRoomId,
      fromRoomName,
      toRoomId: input.toRoomId,
      toRoomName,
      totalDistance: 0,
      pathWaypoints: [startWp],
      instructions: [
        {
          stepIndex: 1,
          instruction: `Đã đến ${toRoomName}`,
          action: "ARRIVE",
          distance: 0,
          floorNumber: startWp.floorNumber,
          waypointId: String(startWp.id),
        },
      ],
    };
  }

  const found = dijkstra(
    input.waypoints,
    input.edges,
    String(startWp.id),
    String(endWp.id),
  );
  if (!found) return null;

  const byId = new Map(input.waypoints.map((w) => [String(w.id), w]));
  const pathWaypoints = found.pathIds
    .map((id) => byId.get(id))
    .filter((w): w is WaypointDto => Boolean(w));

  return {
    fromRoomId: input.fromRoomId,
    fromRoomName,
    toRoomId: input.toRoomId,
    toRoomName,
    totalDistance: Math.round(found.distance * 10) / 10,
    pathWaypoints,
    instructions: generateInstructions(pathWaypoints, fromRoomName, toRoomName),
  };
}

export function uniquePathFloors(path: WaypointDto[]) {
  const seen = new Set<number>();
  const floors: number[] = [];
  for (const wp of path) {
    if (!seen.has(wp.floorNumber)) {
      seen.add(wp.floorNumber);
      floors.push(wp.floorNumber);
    }
  }
  return floors;
}
