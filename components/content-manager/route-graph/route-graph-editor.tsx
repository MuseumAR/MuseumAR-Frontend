"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Node,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Clock,
  LayoutGrid,
  Link2,
  MapPin,
  Plus,
  Redo2,
  Route,
  Save,
  Scan,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { getDisplayError } from "@/lib/validation";
import {
  createRouteEntry,
  updateRouteEntry,
} from "@/services/content-manager/maps-routes.service";
import { updateRoom } from "@/services/content-manager/room.service";
import type {
  AgeGroupDto,
  ExhibitDto,
  ExhibitionDto,
  RoomDto,
  TourRouteDto,
} from "@/types/api";
import {
  buildGraphFromRoute,
  buildRoomNodeData,
  createEdgeBetween,
  orderedRoomsFromStops,
  savePersistedGraph,
  summarizeGraph,
  uniqueFloors,
} from "./graph-utils";
import { applyMetroLayout } from "./layout";
import { MetroEdge } from "./metro-edge";
import { RoomNode } from "./room-node";
import type {
  EdgeConnectionData,
  MetroFlowEdge,
  RoomFlowNode,
  RoomNodeData,
} from "./types";

const nodeTypes = { room: RoomNode };
const edgeTypes = { metro: MetroEdge };
const SELECT_BLUE = "#3B82F6";
const HISTORY_LIMIT = 40;

type HistoryEntry = { nodes: RoomFlowNode[]; edges: MetroFlowEdge[] };

function cloneGraph(nodes: RoomFlowNode[], edges: MetroFlowEdge[]): HistoryEntry {
  return {
    nodes: nodes.map((n) => ({
      ...n,
      position: { ...n.position },
      data: { ...n.data },
    })),
    edges: edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : e.data })),
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium" style={{ color: T.mutedLight }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TourListPanel({
  routes,
  rooms,
  selectedRouteId,
  onSelect,
  onCreateClick,
}: {
  routes: TourRouteDto[];
  rooms: RoomDto[];
  selectedRouteId: number | null;
  onSelect: (route: TourRouteDto) => void;
  onCreateClick: () => void;
}) {
  return (
    <aside
      className="flex h-full w-[280px] shrink-0 flex-col border-r"
      style={{ background: T.surface, borderColor: T.border }}
    >
      <div className="border-b px-4 py-4" style={{ borderColor: T.border }}>
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: T.mutedLight }}
        >
          Tour routes
        </p>
        <h2
          className="mt-1 text-base font-semibold"
          style={{ fontFamily: cinzel, color: T.text }}
        >
          Visitor paths
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {routes.length === 0 ? (
          <div
            className="rounded-2xl px-3 py-8 text-center text-sm"
            style={{ color: T.muted }}
          >
            No tours yet. Create a route to start mapping rooms.
          </div>
        ) : (
          routes.map((route) => {
            const active = route.id === selectedRouteId;
            const roomCount = orderedRoomsFromStops(route.stops ?? [], rooms).length;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onSelect(route)}
                className="w-full rounded-2xl px-3.5 py-3 text-left transition-all"
                style={{
                  background: active ? "rgba(200,155,69,0.16)" : T.bg,
                  border: `1px solid ${active ? T.primary : T.border}`,
                  boxShadow: active ? "0 4px 14px rgba(200,155,69,0.18)" : "none",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-sm font-semibold leading-snug"
                    style={{ color: T.text }}
                  >
                    {route.name || `Route #${route.id}`}
                  </p>
                  {route.isDefault && (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: "rgba(79,125,74,0.12)",
                        color: T.success,
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div
                  className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]"
                  style={{ color: T.muted }}
                >
                  <span>{roomCount} rooms</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {route.estimatedDurationMinutes != null
                      ? `${route.estimatedDurationMinutes} min`
                      : "—"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t p-3" style={{ borderColor: T.border }}>
        <button
          type="button"
          onClick={onCreateClick}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
            color: T.surface,
          }}
        >
          <Plus className="h-4 w-4" />
          Create Route
        </button>
      </div>
    </aside>
  );
}

function PropertiesPanel({
  selectedNode,
  selectedEdge,
  connectedRoomNames,
  rooms,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onOpenRoom,
  onSaveRoom,
}: {
  selectedNode: RoomFlowNode | null;
  selectedEdge: MetroFlowEdge | null;
  connectedRoomNames: string[];
  rooms: RoomDto[];
  onUpdateNode: (nodeId: string, patch: Partial<RoomNodeData>) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<EdgeConnectionData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onOpenRoom: (roomId: number) => void;
  onSaveRoom: (node: RoomFlowNode) => Promise<void>;
}) {
  const [savingRoom, setSavingRoom] = useState(false);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside
        className="flex h-full w-[300px] shrink-0 flex-col border-l"
        style={{ background: T.surface, borderColor: T.border }}
      >
        <div className="border-b px-4 py-4" style={{ borderColor: T.border }}>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: T.mutedLight }}
          >
            Properties
          </p>
          <h2 className="mt-1 text-base font-semibold" style={{ color: T.text }}>
            Nothing selected
          </h2>
        </div>
        <div
          className="flex flex-1 items-center justify-center px-6 text-center text-sm"
          style={{ color: T.muted }}
        >
          Select a room station or metro connection to edit its properties.
        </div>
      </aside>
    );
  }

  if (selectedEdge?.data) {
    const d = selectedEdge.data;
    const from = rooms.find((r) => r.id === d.fromRoomId);
    const to = rooms.find((r) => r.id === d.toRoomId);
    return (
      <aside
        className="flex h-full w-[300px] shrink-0 flex-col border-l"
        style={{ background: T.surface, borderColor: T.border }}
      >
        <div className="border-b px-4 py-4" style={{ borderColor: T.border }}>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: T.mutedLight }}
          >
            Connection
          </p>
          <h2 className="mt-1 text-base font-semibold" style={{ color: T.text }}>
            Metro line
          </h2>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <Field label="From room">
            <p style={{ color: T.text }}>
              {from ? `${from.roomCode} · ${from.roomName}` : d.fromRoomId}
            </p>
          </Field>
          <Field label="To room">
            <p style={{ color: T.text }}>
              {to ? `${to.roomCode} · ${to.roomName}` : d.toRoomId}
            </p>
          </Field>
          <Field label="Walking distance (m)">
            <input
              type="number"
              min={0}
              value={d.walkingDistanceM}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, {
                  walkingDistanceM: Number(e.target.value) || 0,
                })
              }
              className="w-full rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </Field>
          <Field label="Estimated time (min)">
            <input
              type="number"
              min={0}
              value={d.estimatedMinutes}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, {
                  estimatedMinutes: Number(e.target.value) || 0,
                })
              }
              className="w-full rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </Field>
          <Field label="Direction">
            <select
              value={d.direction}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, {
                  direction: e.target.value as EdgeConnectionData["direction"],
                })
              }
              className="w-full rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            >
              <option value="one-way">One-way</option>
              <option value="two-way">Two-way</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm" style={{ color: T.muted }}>
            <input
              type="checkbox"
              checked={d.accessible}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, { accessible: e.target.checked })
              }
              style={{ accentColor: T.primary }}
            />
            Wheelchair accessible
          </label>
          <Field label="Notes">
            <textarea
              rows={3}
              value={d.description}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, { description: e.target.value })
              }
              className="w-full resize-none rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </Field>
          {d.crossFloor && (
            <p
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(217,119,6,0.1)", color: "#B45309" }}
            >
              Cross-floor connection (dashed when filtering floors).
            </p>
          )}
        </div>
        <div className="border-t p-3" style={{ borderColor: T.border }}>
          <button
            type="button"
            onClick={() => onDeleteEdge(selectedEdge.id)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
            style={{ background: "rgba(180,83,9,0.12)", color: T.danger }}
          >
            <Trash2 className="h-4 w-4" />
            Delete connection
          </button>
        </div>
      </aside>
    );
  }

  if (!selectedNode) return null;
  const data = selectedNode.data;

  return (
    <aside
      className="flex h-full w-[300px] shrink-0 flex-col border-l"
      style={{ background: T.surface, borderColor: T.border }}
    >
      <div className="border-b px-4 py-4" style={{ borderColor: T.border }}>
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: T.mutedLight }}
        >
          Room station
        </p>
        <h2 className="mt-1 text-base font-semibold" style={{ color: T.text }}>
          {data.roomCode}
        </h2>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        <Field label="Room name">
          <input
            value={data.roomName}
            onChange={(e) => onUpdateNode(selectedNode.id, { roomName: e.target.value })}
            className="w-full rounded-xl px-3 py-2 outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <Field label="Floor">
          <input
            type="number"
            value={data.floorNumber}
            onChange={(e) =>
              onUpdateNode(selectedNode.id, {
                floorNumber: Number(e.target.value) || 0,
              })
            }
            className="w-full rounded-xl px-3 py-2 outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={data.description ?? ""}
            onChange={(e) =>
              onUpdateNode(selectedNode.id, { description: e.target.value })
            }
            className="w-full resize-none rounded-xl px-3 py-2 outline-none"
            style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
          />
        </Field>
        <Field label="Artifacts">
          <p style={{ color: T.text }}>{data.artifactCount}</p>
        </Field>
        <Field label="Connected rooms">
          {connectedRoomNames.length === 0 ? (
            <p style={{ color: T.mutedLight }}>None</p>
          ) : (
            <ul className="space-y-1">
              {connectedRoomNames.map((name) => (
                <li
                  key={name}
                  className="rounded-lg px-2 py-1 text-xs"
                  style={{ background: T.bg, color: T.muted }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </Field>
      </div>
      <div className="space-y-2 border-t p-3" style={{ borderColor: T.border }}>
        <button
          type="button"
          onClick={() => onOpenRoom(data.roomId)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
          style={{ background: "rgba(200,155,69,0.14)", color: T.primaryDark }}
        >
          Open Room
        </button>
        <button
          type="button"
          disabled={savingRoom}
          onClick={async () => {
            setSavingRoom(true);
            try {
              await onSaveRoom(selectedNode);
            } finally {
              setSavingRoom(false);
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ background: T.primary, color: T.surface }}
        >
          {savingRoom ? "Saving…" : "Edit / Save room"}
        </button>
        <button
          type="button"
          onClick={() => onDeleteNode(selectedNode.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
          style={{ background: "rgba(180,83,9,0.12)", color: T.danger }}
        >
          <Trash2 className="h-4 w-4" />
          Remove from graph
        </button>
      </div>
    </aside>
  );
}

function CreateRouteModal({
  museumId,
  exhibitions,
  ageGroups,
  onClose,
  onCreated,
}: {
  museumId: number;
  exhibitions: ExhibitionDto[];
  ageGroups: AgeGroupDto[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [desc, setDesc] = useState("");
  const [exhibitionId, setExhibitionId] = useState<number | "">("");
  const [ageGroupId, setAgeGroupId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Route name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createRouteEntry({
        museumId,
        name: name.trim(),
        estimatedDurationMinutes: minutes ? Number(minutes) : undefined,
        exhibitionId: exhibitionId || undefined,
        ageGroupId: ageGroupId || undefined,
        translations: [
          {
            languageCode: "vi",
            routeName: name.trim(),
            description: desc.trim() || undefined,
          },
        ],
      });
      onCreated();
    } catch (err) {
      setError(getDisplayError(err, "Unable to create route."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: T.text }}>
            Create route
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5"
            style={{ color: T.muted }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </Field>
          <Field label="Duration (min)">
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full resize-none rounded-xl px-3 py-2 outline-none"
              style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
            />
          </Field>
          {exhibitions.length > 0 && (
            <Field label="Exhibition">
              <select
                value={exhibitionId}
                onChange={(e) =>
                  setExhibitionId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full rounded-xl px-3 py-2 outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                <option value="">—</option>
                {exhibitions.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name || `#${ex.id}`}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {ageGroups.length > 0 && (
            <Field label="Age group">
              <select
                value={ageGroupId}
                onChange={(e) =>
                  setAgeGroupId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full rounded-xl px-3 py-2 outline-none"
                style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
              >
                <option value="">—</option>
                {ageGroups.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.groupName || `#${ag.id}`}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {error && (
            <p className="text-sm" style={{ color: "#8B2E2E" }}>
              {error}
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm"
            style={{ color: T.muted }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: T.primary, color: T.surface }}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function GraphCanvasAndProps({
  museumId,
  route,
  rooms,
  exhibits,
  onRefresh,
}: {
  museumId: number;
  route: TourRouteDto;
  rooms: RoomDto[];
  exhibits: ExhibitDto[];
  onRefresh: () => void;
}) {
  const { fitView } = useReactFlow();
  const initial = useMemo(
    () => buildGraphFromRoute(route, rooms, exhibits, museumId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on route change
    [route.id, museumId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<RoomFlowNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MetroFlowEdge>(initial.edges);
  const [floorFilter, setFloorFilter] = useState<"all" | number>("all");
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editRoomOpen, setEditRoomOpen] = useState(false);

  const historyRef = useRef<HistoryEntry[]>([cloneGraph(initial.nodes, initial.edges)]);
  const historyIndexRef = useRef(0);
  const skipHistoryRef = useRef(false);

  useEffect(() => {
    const g = buildGraphFromRoute(route, rooms, exhibits, museumId);
    skipHistoryRef.current = true;
    setNodes(g.nodes);
    setEdges(g.edges);
    historyRef.current = [cloneGraph(g.nodes, g.edges)];
    historyIndexRef.current = 0;
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setFloorFilter("all");
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
    // Only hard-reload graph when switching routes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.id, museumId, setNodes, setEdges, fitView]);

  const pushHistory = useCallback((nextNodes: RoomFlowNode[], nextEdges: MetroFlowEdge[]) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    const slice = historyRef.current.slice(0, historyIndexRef.current + 1);
    slice.push(cloneGraph(nextNodes, nextEdges));
    if (slice.length > HISTORY_LIMIT) slice.shift();
    historyRef.current = slice;
    historyIndexRef.current = slice.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setNodes(entry.nodes);
    setEdges(entry.edges);
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setNodes(entry.nodes);
    setEdges(entry.edges);
  }, [setNodes, setEdges]);

  const floors = useMemo(() => uniqueFloors(rooms), [rooms]);
  const stats = useMemo(() => summarizeGraph(nodes, edges), [nodes, edges]);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

  const visibleNodes = useMemo(() => {
    if (floorFilter === "all") return nodes;
    return nodes.map((n) => ({
      ...n,
      hidden: n.data.floorNumber !== floorFilter,
    }));
  }, [nodes, floorFilter]);

  const visibleEdges = useMemo(() => {
    return edges.map((e) => {
      const source = nodes.find((n) => n.id === e.source);
      const target = nodes.find((n) => n.id === e.target);
      const crossFloor =
        !!source && !!target && source.data.floorNumber !== target.data.floorNumber;
      const data = e.data ? { ...e.data, crossFloor } : e.data;
      let hidden = false;
      if (floorFilter !== "all") {
        const sourceVisible = source?.data.floorNumber === floorFilter;
        const targetVisible = target?.data.floorNumber === floorFilter;
        hidden = !sourceVisible && !targetVisible;
      }
      return {
        ...e,
        hidden,
        data,
        style: {
          strokeDasharray: crossFloor && floorFilter !== "all" ? "8 6" : undefined,
        },
        selected: e.id === selectedEdgeId,
      };
    });
  }, [edges, nodes, floorFilter, selectedEdgeId]);

  const connectedRoomNames = useMemo(() => {
    if (!selectedNode) return [];
    const names: string[] = [];
    for (const e of edges) {
      if (e.source === selectedNode.id) {
        const t = nodes.find((n) => n.id === e.target);
        if (t) names.push(`${t.data.roomCode} · ${t.data.roomName}`);
      }
      if (e.target === selectedNode.id) {
        const s = nodes.find((n) => n.id === e.source);
        if (s) names.push(`${s.data.roomCode} · ${s.data.roomName}`);
      }
    }
    return [...new Set(names)];
  }, [selectedNode, edges, nodes]);

  const roomsOnCanvas = useMemo(
    () => new Set(nodes.map((n) => n.data.roomId)),
    [nodes],
  );
  const roomsToAdd = rooms.filter((r) => !roomsOnCanvas.has(r.id));

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target)
        return;
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;
      const exists = edges.some(
        (e) =>
          (e.source === connection.source && e.target === connection.target) ||
          (e.source === connection.target && e.target === connection.source),
      );
      if (exists) return;
      const edge = createEdgeBetween(sourceNode, targetNode);
      const next = [...edges, edge];
      setEdges(next);
      pushHistory(nodes, next);
    },
    [nodes, edges, setEdges, pushHistory],
  );

  const onSelectionChange = useCallback(
    ({ nodes: n, edges: e }: OnSelectionChangeParams) => {
      setSelectedNodeId(n[0]?.id ?? null);
      setSelectedEdgeId(e[0]?.id ?? null);
    },
    [],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!connectMode) return;
      if (!connectSourceId) {
        setConnectSourceId(node.id);
        return;
      }
      if (connectSourceId === node.id) {
        setConnectSourceId(null);
        return;
      }
      const sourceNode = nodes.find((n) => n.id === connectSourceId);
      const targetNode = nodes.find((n) => n.id === node.id);
      if (sourceNode && targetNode) {
        const exists = edges.some(
          (ed) =>
            (ed.source === sourceNode.id && ed.target === targetNode.id) ||
            (ed.source === targetNode.id && ed.target === sourceNode.id),
        );
        if (!exists) {
          const edge = createEdgeBetween(sourceNode, targetNode);
          const next = [...edges, edge];
          setEdges(next);
          pushHistory(nodes, next);
        }
      }
      setConnectSourceId(null);
      setConnectMode(false);
    },
    [connectMode, connectSourceId, nodes, edges, setEdges, pushHistory],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedEdgeId) {
          e.preventDefault();
          const next = edges.filter((ed) => ed.id !== selectedEdgeId);
          setEdges(next);
          setSelectedEdgeId(null);
          pushHistory(nodes, next);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdgeId, edges, nodes, setEdges, pushHistory, undo, redo]);

  function addRoomToGraph(room: RoomDto) {
    const node: RoomFlowNode = {
      id: `room-${room.id}`,
      type: "room",
      position: {
        x: 120 + nodes.length * 40,
        y: 120 + (nodes.length % 3) * 100,
      },
      data: buildRoomNodeData(room, exhibits, route.exhibitionName ?? undefined),
    };
    const next = [...nodes, node];
    setNodes(next);
    pushHistory(next, edges);
    setAddRoomOpen(false);
  }

  function deleteSelectedConnection() {
    if (!selectedEdgeId) return;
    const next = edges.filter((e) => e.id !== selectedEdgeId);
    setEdges(next);
    setSelectedEdgeId(null);
    pushHistory(nodes, next);
  }

  function runAutoLayout() {
    const laid = applyMetroLayout(nodes, edges, "LR");
    setNodes(laid);
    pushHistory(laid, edges);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 30);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      savePersistedGraph(museumId, {
        routeId: route.id,
        nodes: nodes.map((n) => ({
          id: n.id,
          roomId: n.data.roomId,
          position: n.position,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          data: e.data!,
        })),
      });
      const visitMins = summarizeGraph(nodes, edges).estimatedVisitMinutes;
      if (visitMins > 0) {
        await updateRouteEntry(route.id, { estimatedDurationMinutes: visitMins });
      }
      setSaveMsg("Route graph saved");
      onRefresh();
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (err) {
      setSaveMsg(getDisplayError(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  const toolBtn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    opts?: { active?: boolean; danger?: boolean; disabled?: boolean },
  ) => (
    <button
      type="button"
      title={label}
      disabled={opts?.disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
      style={{
        background: opts?.active
          ? "rgba(59,130,246,0.14)"
          : opts?.danger
            ? "rgba(180,83,9,0.1)"
            : T.bg,
        color: opts?.active ? SELECT_BLUE : opts?.danger ? T.danger : T.muted,
        border: `1px solid ${opts?.active ? "rgba(59,130,246,0.35)" : T.border}`,
      }}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: T.bg }}>
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: T.border, background: T.surface }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="h-3.5 w-3.5" style={{ color: T.mutedLight }} />
            <button
              type="button"
              onClick={() => setFloorFilter("all")}
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: floorFilter === "all" ? T.primary : T.bg,
                color: floorFilter === "all" ? T.surface : T.muted,
                border: `1px solid ${T.border}`,
              }}
            >
              All Floors
            </button>
            {floors.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFloorFilter(f)}
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: floorFilter === f ? T.primary : T.bg,
                  color: floorFilter === f ? T.surface : T.muted,
                  border: `1px solid ${T.border}`,
                }}
              >
                Floor {f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: T.muted }}>
            <span>
              Rooms: <strong style={{ color: T.text }}>{stats.roomCount}</strong>
            </span>
            <span>
              Connections:{" "}
              <strong style={{ color: T.text }}>{stats.connectionCount}</strong>
            </span>
            <span>
              Est. visit:{" "}
              <strong style={{ color: T.text }}>{stats.estimatedVisitMinutes} min</strong>
            </span>
            <span>
              Distance: <strong style={{ color: T.text }}>{stats.totalDistance} m</strong>
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2"
          style={{ borderColor: T.border, background: "rgba(253,248,239,0.95)" }}
        >
          {toolBtn("Add Room", <Plus className="h-3.5 w-3.5" />, () =>
            setAddRoomOpen((v) => !v),
          )}
          {toolBtn(
            connectMode
              ? connectSourceId
                ? "Pick target…"
                : "Pick source…"
              : "Connect Rooms",
            <Link2 className="h-3.5 w-3.5" />,
            () => {
              setConnectMode((v) => !v);
              setConnectSourceId(null);
            },
            { active: connectMode },
          )}
          {toolBtn(
            "Delete Connection",
            <Trash2 className="h-3.5 w-3.5" />,
            deleteSelectedConnection,
            { danger: true, disabled: !selectedEdgeId },
          )}
          {toolBtn("Auto Layout", <LayoutGrid className="h-3.5 w-3.5" />, runAutoLayout)}
          {toolBtn("Center Graph", <Scan className="h-3.5 w-3.5" />, () =>
            fitView({ padding: 0.25, duration: 400 }),
          )}
          {toolBtn("Undo", <Undo2 className="h-3.5 w-3.5" />, undo)}
          {toolBtn("Redo", <Redo2 className="h-3.5 w-3.5" />, redo)}
          <div className="ml-auto flex items-center gap-2">
            {saveMsg && (
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    saveMsg.toLowerCase().includes("fail") ||
                    saveMsg.toLowerCase().includes("unable")
                      ? "#8B2E2E"
                      : T.success,
                }}
              >
                {saveMsg}
              </span>
            )}
            {toolBtn(
              saving ? "Saving…" : "Save Route",
              <Save className="h-3.5 w-3.5" />,
              handleSave,
              { disabled: saving },
            )}
          </div>
        </div>

        {addRoomOpen && (
          <div
            className="max-h-36 overflow-y-auto border-b px-4 py-2"
            style={{ borderColor: T.border, background: T.surface }}
          >
            {roomsToAdd.length === 0 ? (
              <p className="text-xs" style={{ color: T.muted }}>
                All rooms are already on the map.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roomsToAdd.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => addRoomToGraph(room)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                    }}
                  >
                    + {room.roomCode} · {room.roomName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {connectMode && (
          <div
            className="px-4 py-1.5 text-xs font-medium"
            style={{ background: "rgba(59,130,246,0.1)", color: SELECT_BLUE }}
          >
            Connect mode: click source room, then target — or drag between handles.
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          <ReactFlow
            nodes={visibleNodes.map((n) => ({
              ...n,
              selected: n.id === selectedNodeId,
            }))}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
              setEditRoomOpen(true);
            }}
            onNodeDragStop={() => pushHistory(nodes, edges)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            selectionMode={SelectionMode.Partial}
            panOnDrag
            zoomOnScroll
            deleteKeyCode={null}
            connectionLineStyle={{ stroke: T.primaryDark, strokeWidth: 2.5 }}
            defaultEdgeOptions={{
              type: "metro",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: T.primaryDark,
                width: 18,
                height: 18,
              },
            }}
            proOptions={{ hideAttribution: true }}
            style={{ background: "#F3EBD9" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.2}
              color="rgba(200,155,69,0.35)"
            />
            <Controls
              showInteractive={false}
              style={{
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                overflow: "hidden",
                background: T.surface,
              }}
            />
            <MiniMap
              position="bottom-right"
              pannable
              zoomable
              nodeColor={(n) => {
                const status = (n.data as RoomNodeData | undefined)?.status;
                if (status === "published") return T.success;
                if (status === "draft") return "#D97706";
                return T.mutedLight;
              }}
              maskColor="rgba(43,29,14,0.12)"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
              }}
            />
          </ReactFlow>
        </div>
      </div>

      <PropertiesPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        connectedRoomNames={connectedRoomNames}
        rooms={rooms}
        onUpdateNode={(nodeId, patch) => {
          const next = nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
          );
          const nextEdges =
            patch.floorNumber != null
              ? edges.map((e) => {
                  const s = next.find((n) => n.id === e.source);
                  const t = next.find((n) => n.id === e.target);
                  if (!s || !t || !e.data) return e;
                  return {
                    ...e,
                    data: {
                      ...e.data,
                      crossFloor: s.data.floorNumber !== t.data.floorNumber,
                    },
                  };
                })
              : edges;
          setNodes(next);
          setEdges(nextEdges);
          pushHistory(next, nextEdges);
        }}
        onUpdateEdge={(edgeId, patch) => {
          const next = edges.map((e) =>
            e.id === edgeId && e.data ? { ...e, data: { ...e.data, ...patch } } : e,
          );
          setEdges(next);
          pushHistory(nodes, next);
        }}
        onDeleteNode={(nodeId) => {
          const nextNodes = nodes.filter((n) => n.id !== nodeId);
          const nextEdges = edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
          );
          setNodes(nextNodes);
          setEdges(nextEdges);
          setSelectedNodeId(null);
          pushHistory(nextNodes, nextEdges);
        }}
        onDeleteEdge={(edgeId) => {
          const next = edges.filter((e) => e.id !== edgeId);
          setEdges(next);
          setSelectedEdgeId(null);
          pushHistory(nodes, next);
        }}
        onOpenRoom={() => setEditRoomOpen(true)}
        onSaveRoom={async (node) => {
          await updateRoom(node.data.roomId, {
            roomName: node.data.roomName,
            floorNumber: node.data.floorNumber,
            description: node.data.description,
          });
          onRefresh();
        }}
      />

      {editRoomOpen && selectedNode && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditRoomOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5 shadow-xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold" style={{ color: T.text }}>
              Room editor
            </h3>
            <p className="mt-1 text-sm" style={{ color: T.muted }}>
              {selectedNode.data.roomCode} · {selectedNode.data.roomName}
            </p>
            <p className="mt-3 text-xs" style={{ color: T.mutedLight }}>
              Floor {selectedNode.data.floorNumber} · {selectedNode.data.artifactCount}{" "}
              artifacts
            </p>
            <p className="mt-2 text-sm" style={{ color: T.muted }}>
              {selectedNode.data.description || "No description"}
            </p>
            <button
              type="button"
              onClick={() => setEditRoomOpen(false)}
              className="mt-5 w-full rounded-xl py-2.5 text-sm font-medium"
              style={{ background: T.primary, color: T.surface }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function GraphWorkspace({
  museumId,
  route,
  rooms,
  exhibits,
  onRefresh,
}: {
  museumId: number;
  route: TourRouteDto;
  rooms: RoomDto[];
  exhibits: ExhibitDto[];
  onRefresh: () => void;
}) {
  return (
    <ReactFlowProvider>
      <GraphCanvasAndProps
        museumId={museumId}
        route={route}
        rooms={rooms}
        exhibits={exhibits}
        onRefresh={onRefresh}
      />
    </ReactFlowProvider>
  );
}

export function RouteGraphEditor({
  routes,
  rooms,
  exhibits,
  museumId,
  exhibitions = [],
  ageGroups = [],
  onRefresh,
}: {
  routes: TourRouteDto[];
  rooms: RoomDto[];
  exhibits: ExhibitDto[];
  museumId: number;
  exhibitions?: ExhibitionDto[];
  ageGroups?: AgeGroupDto[];
  onRefresh: () => void;
}) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(
    routes[0]?.id ?? null,
  );
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (selectedRouteId == null && routes[0]) {
      setSelectedRouteId(routes[0].id);
      return;
    }
    if (selectedRouteId != null && !routes.some((r) => r.id === selectedRouteId)) {
      setSelectedRouteId(routes[0]?.id ?? null);
    }
  }, [routes, selectedRouteId]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  return (
    <div
      className="flex overflow-hidden rounded-3xl"
      style={{
        height: "calc(100vh - 168px)",
        minHeight: 560,
        border: `1px solid ${T.border}`,
        background: T.surface,
        boxShadow: "0 8px 32px rgba(43,29,14,0.06)",
      }}
    >
      <TourListPanel
        routes={routes}
        rooms={rooms}
        selectedRouteId={selectedRouteId}
        onSelect={(r) => setSelectedRouteId(r.id)}
        onCreateClick={() => setShowCreate(true)}
      />

      {selectedRoute ? (
        <GraphWorkspace
          key={selectedRoute.id}
          museumId={museumId}
          route={selectedRoute}
          rooms={rooms}
          exhibits={exhibits}
          onRefresh={onRefresh}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <Route className="h-10 w-10" style={{ color: T.mutedLight }} />
          <p className="text-sm" style={{ color: T.muted }}>
            Create a tour route to open the metro map editor.
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-2xl px-5 py-2.5 text-sm font-medium"
            style={{ background: T.primary, color: T.surface }}
          >
            Create Route
          </button>
        </div>
      )}

      {showCreate && (
        <CreateRouteModal
          museumId={museumId}
          exhibitions={exhibitions}
          ageGroups={ageGroups}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
