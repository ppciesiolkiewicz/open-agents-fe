"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeMouseHandler,
  getStraightPath,
  Handle,
  type Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentEditDialog } from "@/components/AgentEditDialog";
import { api } from "@/lib/api";
import { agentsQueryKey } from "@/lib/agentsQuery";
import type { AgentConfig } from "@/sdk";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { GearIcon, PlayIcon } from "@/ui/icons";
import { Spinner } from "@/ui/Spinner";

const STORAGE_KEY = "agents-graph-layout-v1";
const X_GAP = 280;
const Y_GAP = 170;

interface XYPosition {
  x: number;
  y: number;
}

interface NodeData extends Record<string, unknown> {
  agent: AgentConfig;
}

interface RemovableEdgeData extends Record<string, unknown> {
  onRemove?: (source: string, target: string) => void;
  removing?: boolean;
}

interface AgentGraphProps {
  agents: AgentConfig[];
}

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars - 1)}...`;
}

function readStoredPositions(): Record<string, XYPosition> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, XYPosition>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeStoredPositions(positions: Record<string, XYPosition>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function getAutoPosition(index: number): XYPosition {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: col * X_GAP,
    y: row * Y_GAP,
  };
}

function buildEdges(agents: AgentConfig[]): Edge[] {
  const agentIds = new Set(agents.map((a) => a.id));
  const seen = new Set<string>();
  const edges: Edge[] = [];

  for (const agent of agents) {
    for (const peerId of agent.connectedAgentIds) {
      if (peerId === agent.id || !agentIds.has(peerId)) continue;
      const key = edgeKey(agent.id, peerId);
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: key,
        source: agent.id,
        target: peerId,
        type: "removableConnection",
        style: { strokeWidth: 2, stroke: "#64748b" },
      });
    }
  }

  return edges;
}

function AgentNode({ data }: { data: NodeData }) {
  const queryClient = useQueryClient();
  const [editedAgent, setEditedAgent] = useState<AgentConfig | null>(null);
  const agent = editedAgent ?? data.agent;
  const [editOpen, setEditOpen] = useState(false);
  const [runningOverride, setRunningOverride] = useState<boolean | null>(null);
  const running = runningOverride ?? Boolean(agent.running);
  const [starting, setStarting] = useState(false);
  const [openingConfig, setOpeningConfig] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const startAgent = useCallback(async () => {
    if (running || starting) return;
    setStarting(true);
    try {
      const updated = await api.agentsIdStartPost({ id: agent.id });
      setRunningOverride(Boolean(updated.running));
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
    } finally {
      setStarting(false);
    }
  }, [agent.id, queryClient, running, starting]);

  const openConfig = useCallback(async () => {
    if (openingConfig) return;
    setOpeningConfig(true);
    try {
      const latest = await api.agentsIdGet({ id: agent.id });
      setEditedAgent(latest);
      setRunningOverride(Boolean(latest.running));
    } catch {
      // Fall back to currently rendered data if fetch fails.
    } finally {
      setOpeningConfig(false);
      setEditOpen(true);
    }
  }, [agent.id, openingConfig]);

  const deleteAgent = useCallback(async () => {
    if (deleting) return;
    const confirmed = window.confirm(
      `Delete "${agent.name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeleting(true);
    try {
      await api.agentsIdDelete({ id: agent.id });
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  }, [agent.id, agent.name, deleting, queryClient]);

  const fullPrompt = agent.prompt.trim() || "No prompt";
  const promptPreview = truncateText(fullPrompt, 50);
  const dryRunLabel = agent.dryRun ? "Enabled" : "Disabled";

  return (
    <div className="relative min-w-56 rounded-lg border border-zinc-300 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-zinc-400 !bg-zinc-200 dark:!border-zinc-600 dark:!bg-zinc-700"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-zinc-400 !bg-zinc-200 dark:!border-zinc-600 dark:!bg-zinc-700"
      />
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
          {agent.name}
        </div>
        <div className="flex items-center gap-1">
          {agent.dryRun && <Badge tone="warning">dry run</Badge>}
          <button
            type="button"
            className="nodrag nopan inline-flex size-6 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white text-sm text-zinc-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300"
            aria-label={`Delete ${agent.name}`}
            title={`Delete ${agent.name}`}
            onClick={deleteAgent}
            disabled={deleting}
          >
            {deleting ? <Spinner size="sm" aria-label="Deleting agent" /> : "×"}
          </button>
        </div>
      </div>
      <div className="mb-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <p className="truncate">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Prompt: </span>
          <span title={fullPrompt}>{promptPreview}</span>
        </p>
        <p className="truncate">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Dry run: </span>
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              agent.dryRun
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
            ].join(" ")}
          >
            {dryRunLabel}
          </span>
        </p>
        <p className="truncate">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Max trade: </span>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            ${agent.riskLimits.maxTradeUSD}
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {agent.connectedAgentIds.length} connection
          {agent.connectedAgentIds.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={startAgent}
            disabled={running || starting}
            className="nodrag nopan h-7 px-2 text-xs"
          >
            {starting ? (
              <Spinner size="sm" aria-label="Starting agent" />
            ) : (
              <span className="inline-flex items-center gap-1">
                <PlayIcon className="size-3.5" />
                {running ? "Running" : "Start"}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={openConfig}
            disabled={openingConfig}
            className="nodrag nopan h-7 px-2 text-xs"
          >
            {openingConfig ? (
              <Spinner size="sm" aria-label="Loading configuration" />
            ) : (
              <span className="inline-flex items-center gap-1">
                <GearIcon className="size-3.5" />
                Config
              </span>
            )}
          </Button>
          <Link
            href={`/agents/${agent.id}`}
            className="nodrag nopan cursor-pointer rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Open
          </Link>
        </div>
      </div>
      {deleteError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{deleteError}</p>
      )}
      <AgentEditDialog
        agent={agent}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(next) => {
          setEditedAgent(next);
          setRunningOverride(Boolean(next.running));
        }}
      />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

function RemovableConnectionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: Edge<RemovableEdgeData> & {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  markerEnd?: string;
}) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const isRemoving = Boolean(data?.removing);

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <button
          type="button"
          className="nodrag nopan absolute flex size-5 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-[12px] leading-none text-zinc-600 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onClick={(event) => {
            event.stopPropagation();
            if (isRemoving) return;
            data?.onRemove?.(source, target);
          }}
          aria-label="Remove connection"
          title="Remove connection"
          disabled={isRemoving}
        >
          {isRemoving ? <Spinner size="sm" /> : "×"}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { removableConnection: RemovableConnectionEdge };

function AgentGraphInner({ agents }: AgentGraphProps) {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [mutating, setMutating] = useState(false);
  const [removingEdgeId, setRemovingEdgeId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const stored = readStoredPositions();
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      return agents.map((agent, index) => {
        const existing = prevById.get(agent.id);
        const position =
          existing?.position ?? stored[agent.id] ?? getAutoPosition(index);
        return {
          ...existing,
          id: agent.id,
          type: "agentNode",
          position,
          data: { agent },
          draggable: true,
        };
      });
    });
  }, [agents, setNodes]);

  useLayoutEffect(() => {
    setEdges(buildEdges(agents));
  }, [agents, setEdges]);

  useLayoutEffect(() => {
    if (nodes.length === 0) return;
    const next: Record<string, XYPosition> = {};
    for (const node of nodes) {
      next[node.id] = node.position;
    }
    writeStoredPositions(next);
  }, [nodes]);

  const onConnect = useCallback(
    async (connection: { source: string | null; target: string | null }) => {
      const source = connection.source;
      const target = connection.target;
      if (!source || !target || source === target || mutating) return;

      setMutationError(null);
      setMutating(true);
      try {
        await api.agentsIdConnectionsPost({
          id: source,
          manageAgentConnectionBody: { peerAgentId: target },
        });
        void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      } catch (e) {
        setMutationError(
          e instanceof Error ? e.message : "Failed to create connection",
        );
      } finally {
        setMutating(false);
      }
    },
    [mutating, queryClient],
  );

  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      if (mutating || deletedEdges.length === 0) return;
      setMutationError(null);
      setMutating(true);
      try {
        for (const edge of deletedEdges) {
          await api.agentsIdConnectionsPeerAgentIdDelete({
            id: edge.source,
            peerAgentId: edge.target,
          });
        }
        void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      } catch (e) {
        setMutationError(
          e instanceof Error ? e.message : "Failed to remove connection",
        );
      } finally {
        setMutating(false);
      }
    },
    [mutating, queryClient],
  );

  const removeConnection = useCallback(
    async (source: string, target: string) => {
      if (mutating) return;
      const key = edgeKey(source, target);
      setMutationError(null);
      setMutating(true);
      setRemovingEdgeId(key);
      try {
        await api.agentsIdConnectionsPeerAgentIdDelete({
          id: source,
          peerAgentId: target,
        });
        void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      } catch (e) {
        setMutationError(
          e instanceof Error ? e.message : "Failed to remove connection",
        );
      } finally {
        setRemovingEdgeId(null);
        setMutating(false);
      }
    },
    [mutating, queryClient],
  );

  const onEdgeClick = useCallback<EdgeMouseHandler<Edge>>(
    (_event, edge) => {
      void removeConnection(edge.source, edge.target);
    },
    [removeConnection],
  );

  const edgesWithHandlers = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "removableConnection",
        data: {
          onRemove: removeConnection,
          removing: removingEdgeId === edge.id,
        } satisfies RemovableEdgeData,
      })),
    [edges, removeConnection, removingEdgeId],
  );

  return (
    <div className="h-[68dvh] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>Drag agents to arrange layout. Drag between nodes to connect.</span>
      </div>
      {mutationError && (
        <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {mutationError}
        </div>
      )}
      <div className="h-[calc(68dvh-2.6rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edgesWithHandlers}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          elementsSelectable
          nodesConnectable
          nodesDraggable
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Background variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function AgentGraph(props: AgentGraphProps) {
  return (
    <ReactFlowProvider>
      <AgentGraphInner {...props} />
    </ReactFlowProvider>
  );
}
