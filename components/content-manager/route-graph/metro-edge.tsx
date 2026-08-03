"use client";

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import { dashboardTheme as T } from "@/lib/dashboard-theme";
import type { MetroFlowEdge } from "./types";

export function MetroEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  selected,
}: EdgeProps<MetroFlowEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const dashed = data?.crossFloor;
  const stroke = selected ? "#3B82F6" : T.primaryDark;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke,
          strokeWidth: selected ? 3.5 : 2.75,
          strokeDasharray: dashed ? "8 6" : undefined,
          opacity: 0.92,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: T.surface,
            color: T.muted,
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 8px rgba(43,29,14,0.08)",
          }}
        >
          {data?.estimatedMinutes ?? 0} min
          {data?.walkingDistanceM != null ? ` · ${data.walkingDistanceM}m` : ""}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
