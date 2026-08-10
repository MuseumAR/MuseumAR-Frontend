import type {
  NavigationInstructionDto,
  NavigationRouteResponseDto,
  WaypointDto,
} from "@/types/api";

const TURN_THRESHOLD_DEG = 35;

function waypointPlaceLabel(wp: WaypointDto): string {
  if (wp.name?.trim()) return wp.name.trim();
  if (wp.waypointType === "DOOR") return "cửa phòng";
  if (wp.waypointType === "STAIRS") return "cầu thang";
  if (wp.waypointType === "ELEVATOR") return "thang máy";
  if (wp.waypointType === "ROOM") return "phòng";
  return "hành lang";
}

function turnFromSegments(
  prev: WaypointDto,
  curr: WaypointDto,
  next: WaypointDto,
): { text: string; action: string } {
  if (prev.floorNumber !== curr.floorNumber) {
    return { text: "Đi thẳng", action: "STRAIGHT" };
  }

  const v1x = curr.locationX - prev.locationX;
  const v1y = curr.locationY - prev.locationY;
  const v2x = next.locationX - curr.locationX;
  const v2y = next.locationY - curr.locationY;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);
  if (mag1 < 1e-6 || mag2 < 1e-6) {
    return { text: "Đi thẳng", action: "STRAIGHT" };
  }

  // Screen Y grows downward; positive atan2(cross, dot) = clockwise = right on map.
  const cross = v1x * v2y - v1y * v2x;
  const dot = v1x * v2x + v1y * v2y;
  const angleDeg = (Math.atan2(cross, dot) * 180) / Math.PI;

  if (angleDeg > TURN_THRESHOLD_DEG) {
    return { text: "Rẽ phải", action: "TURN_RIGHT" };
  }
  if (angleDeg < -TURN_THRESHOLD_DEG) {
    return { text: "Rẽ trái", action: "TURN_LEFT" };
  }
  return { text: "Đi thẳng", action: "STRAIGHT" };
}

/** Temporary FE rebuild — BE still uses |cross| > 10 which mislabels near-straight paths. */
export function buildNavigationInstructions(
  path: WaypointDto[],
  fromRoomName: string,
  toRoomName: string,
): NavigationInstructionDto[] {
  if (!path.length) return [];

  const raw: NavigationInstructionDto[] = [];

  raw.push({
    stepIndex: 0,
    instruction: `Bắt đầu di chuyển từ ${fromRoomName}`,
    action: "START",
    distance: 0,
    floorNumber: path[0].floorNumber,
    waypointId: path[0].id,
  });

  for (let i = 0; i < path.length - 1; i++) {
    const w1 = path[i];
    const w2 = path[i + 1];

    if (w1.floorNumber !== w2.floorNumber) {
      const goingUp = w2.floorNumber > w1.floorNumber;
      const isElevator = w2.waypointType === "ELEVATOR";
      raw.push({
        stepIndex: 0,
        instruction: `${isElevator ? "Đi thang máy" : "Đi cầu thang"} lên Tầng ${w2.floorNumber}`,
        action: goingUp ? "STAIR_UP" : "STAIR_DOWN",
        distance: 1,
        floorNumber: w2.floorNumber,
        waypointId: w2.id,
      });
      continue;
    }

    const dist =
      Math.round(
        Math.hypot(w2.locationX - w1.locationX, w2.locationY - w1.locationY) * 10,
      ) / 10;

    let turnText = "Đi thẳng";
    let action = "STRAIGHT";
    if (i > 0) {
      const turn = turnFromSegments(path[i - 1], w1, w2);
      turnText = turn.text;
      action = turn.action;
    }

    raw.push({
      stepIndex: 0,
      instruction: `${turnText} qua ${waypointPlaceLabel(w2)}`,
      action,
      distance: dist,
      floorNumber: w2.floorNumber,
      waypointId: w2.id,
    });
  }

  const last = path[path.length - 1];
  raw.push({
    stepIndex: 0,
    instruction: `Đã đến ${toRoomName}`,
    action: "ARRIVE",
    distance: 0,
    floorNumber: last.floorNumber,
    waypointId: last.id,
  });

  return mergeConsecutiveStraights(raw);
}

/** Collapse consecutive STRAIGHT steps into one (sum distance, keep last place label). */
function mergeConsecutiveStraights(
  steps: NavigationInstructionDto[],
): NavigationInstructionDto[] {
  const merged: NavigationInstructionDto[] = [];

  for (const step of steps) {
    const prev = merged[merged.length - 1];
    if (
      step.action === "STRAIGHT" &&
      prev?.action === "STRAIGHT" &&
      step.distance > 0 &&
      prev.distance > 0
    ) {
      const dist = Math.round((prev.distance + step.distance) * 10) / 10;
      // Prefer the later place label ("qua phòng" when entering destination room).
      const place = step.instruction.replace(/^Đi thẳng qua\s+/i, "").trim();
      merged[merged.length - 1] = {
        ...prev,
        instruction: `Đi thẳng qua ${place || "hành lang"}`,
        distance: dist,
        floorNumber: step.floorNumber,
        waypointId: step.waypointId,
      };
      continue;
    }
    merged.push({ ...step });
  }

  return merged.map((step, i) => ({ ...step, stepIndex: i + 1 }));
}

export function withCorrectedNavigationInstructions(
  route: NavigationRouteResponseDto,
): NavigationRouteResponseDto {
  if (!route.pathWaypoints.length) return route;
  return {
    ...route,
    instructions: buildNavigationInstructions(
      route.pathWaypoints,
      route.fromRoomName,
      route.toRoomName,
    ),
  };
}
