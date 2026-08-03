import dagre from "@dagrejs/dagre";
import type { MetroFlowEdge, RoomFlowNode } from "./types";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;

/** Arrange nodes like a metro map: left→right ranks, tidy spacing, mostly orthogonal lines. */
export function applyMetroLayout(
  nodes: RoomFlowNode[],
  edges: MetroFlowEdge[],
  direction: "LR" | "TB" = "LR",
): RoomFlowNode[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 72,
    ranksep: 110,
    marginx: 40,
    marginy: 40,
    align: "UL",
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}
