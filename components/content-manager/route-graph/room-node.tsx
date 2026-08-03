"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Landmark } from "lucide-react";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import type { RoomFlowNode, RoomPublishStatus } from "./types";

const STATUS_COLOR: Record<RoomPublishStatus, string> = {
  published: T.success,
  draft: "#D97706",
  hidden: T.mutedLight,
};

function RoomNodeComponent({ data, selected }: NodeProps<RoomFlowNode>) {
  const statusColor = STATUS_COLOR[data.status] ?? T.mutedLight;

  return (
    <div
      className="relative w-[220px] rounded-2xl px-3.5 py-3 transition-shadow"
      style={{
        background: T.surface,
        border: `2px solid ${selected ? "#3B82F6" : T.border}`,
        boxShadow: selected
          ? "0 0 0 3px rgba(59,130,246,0.22), 0 8px 24px rgba(43,29,14,0.12)"
          : "0 4px 16px rgba(43,29,14,0.08)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2"
        style={{ background: T.primary, borderColor: T.surface }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2"
        style={{ background: T.primary, borderColor: T.surface }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-2.5 !w-2.5 !border-2"
        style={{ background: T.primary, borderColor: T.surface }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2.5 !w-2.5 !border-2"
        style={{ background: T.primary, borderColor: T.surface }}
      />

      <div className="flex items-start gap-2.5">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(200,155,69,0.14)", color: T.primaryDark }}
        >
          <Landmark className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold" style={{ color: T.text }}>
              {data.roomCode || data.roomName}
            </p>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: statusColor }}
              title={data.status}
            />
          </div>
          <p className="mt-0.5 truncate text-xs" style={{ color: T.muted }}>
            {data.roomName}
            {data.exhibitionLabel ? ` · ${data.exhibitionLabel}` : ""}
          </p>
          <p className="mt-1 text-[11px] font-medium" style={{ color: T.mutedLight }}>
            Floor {data.floorNumber} · {data.artifactCount} artifact
            {data.artifactCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}

export const RoomNode = memo(RoomNodeComponent);
