import type { Edge, Node } from "@xyflow/react";

export type RoomPublishStatus = "published" | "draft" | "hidden";

export type RoomNodeData = {
  roomId: number;
  roomCode: string;
  roomName: string;
  floorNumber: number;
  description?: string | null;
  artifactCount: number;
  status: RoomPublishStatus;
  exhibitionLabel?: string;
};

export type EdgeConnectionData = {
  fromRoomId: number;
  toRoomId: number;
  walkingDistanceM: number;
  estimatedMinutes: number;
  direction: "one-way" | "two-way";
  accessible: boolean;
  description: string;
  crossFloor: boolean;
};

export type RoomFlowNode = Node<RoomNodeData, "room">;
export type MetroFlowEdge = Edge<EdgeConnectionData>;

export type GraphSnapshot = {
  nodes: RoomFlowNode[];
  edges: MetroFlowEdge[];
};

export type PersistedRouteGraph = {
  routeId: number;
  nodes: Array<{
    id: string;
    roomId: number;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data: EdgeConnectionData;
  }>;
};
