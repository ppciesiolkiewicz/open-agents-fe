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
import { invalidateAgentsAndChannelsQueries } from "@/lib/agentsQuery";
import type { AgentConfig, AxlChannel } from "@/sdk";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { GearIcon, PlayIcon } from "@/ui/icons";
import { Spinner } from "@/ui/Spinner";

const STORAGE_KEY = "agents-graph-layout-v2";
const X_GAP = 280;
const Y_GAP = 170;

interface XYPosition {
  x: number;
  y: number;
}

type GraphAgentNodeData = {
  kind: "agent";
  agent: AgentConfig;
} & Record<string, unknown>;

type GraphChannelNodeData = {
  kind: "channel";
  channel: AxlChannel;
} & Record<string, unknown>;

type GraphNodeData = GraphAgentNodeData | GraphChannelNodeData;

interface RemovableEdgeData extends Record<string, unknown> {
  onRemove?: () => void;
  removing?: boolean;
}

interface AgentGraphProps {
  agents: AgentConfig[];
  channels: AxlChannel[];
}

function agentNodeId(agentId: string): string {
  return `agent:${agentId}`;
}

function channelNodeId(channelId: string): string {
  return `channel:${channelId}`;
}

function rawAgentFromNode(id: string): string | null {
  return id.startsWith("agent:") ? id.slice("agent:".length) : null;
}

function rawChannelFromNode(id: string): string | null {
  return id.startsWith("channel:") ? id.slice("channel:".length) : null;
}

function sortedPairEdgeKey(left: string, right: string): string {
  return [left, right].sort().join("::");
}

function peerAgentEdgeId(leftId: string, rightId: string): string {
  return `peer::${sortedPairEdgeKey(leftId, rightId)}`;
}

function membershipEdgeId(agentId: string, channelId: string): string {
  return `ch::${agentId}::${channelId}`;
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

function buildAgentAgentEdges(agents: AgentConfig[]): Edge[] {
  const agentIds = new Set(agents.map((a) => a.id));
  const seen = new Set<string>();
  const edges: Edge[] = [];

  for (const agent of agents) {
    for (const peerId of agent.connectedAgentIds) {
      if (peerId === agent.id || !agentIds.has(peerId)) continue;
      const id = peerAgentEdgeId(agent.id, peerId);
      if (seen.has(id)) continue;
      seen.add(id);
      edges.push({
        id,
        source: agentNodeId(agent.id),
        target: agentNodeId(peerId),
        type: "removableConnection",
        style: { strokeWidth: 2, stroke: "#64748b" },
      });
    }
  }

  return edges;
}

function buildAgentChannelEdges(
  agents: AgentConfig[],
  channels: AxlChannel[],
): Edge[] {
  const channelIds = new Set(channels.map((c) => c.id));
  const seen = new Set<string>();
  const edges: Edge[] = [];

  for (const agent of agents) {
    for (const channelId of agent.connectedChannelIds) {
      if (!channelIds.has(channelId)) continue;
      const id = membershipEdgeId(agent.id, channelId);
      if (seen.has(id)) continue;
      seen.add(id);
      edges.push({
        id,
        source: agentNodeId(agent.id),
        target: channelNodeId(channelId),
        type: "removableConnection",
        style: { strokeWidth: 2, stroke: "#b45309" },
      });
    }
  }

  return edges;
}

function mergeReactFlowNodes(
  prev: Node<GraphNodeData>[],
  agents: AgentConfig[],
  channels: AxlChannel[],
): Node<GraphNodeData>[] {
  const stored = readStoredPositions();
  const prevById = new Map(prev.map((n) => [n.id, n]));

  const next: Node<GraphNodeData>[] = [];

  agents.forEach((agent, index) => {
    const id = agentNodeId(agent.id);
    const existing = prevById.get(id);
    const position =
      existing?.position ?? stored[id] ?? getAutoPosition(index);
    next.push({
      ...existing,
      id,
      type: "agentNode",
      position,
      data: { kind: "agent", agent },
      draggable: true,
    });
  });

  channels.forEach((channel, idx) => {
    const id = channelNodeId(channel.id);
    const existing = prevById.get(id);
    const layoutIndex = idx + agents.length;
    const position =
      existing?.position ?? stored[id] ?? getAutoPosition(layoutIndex);
    next.push({
      ...existing,
      id,
      type: "channelNode",
      position,
      data: { kind: "channel", channel },
      draggable: true,
    });
  });

  return next;
}

function AgentNode({ data }: { data: GraphAgentNodeData }) {
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
      invalidateAgentsAndChannelsQueries(queryClient);
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
      invalidateAgentsAndChannelsQueries(queryClient);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  }, [agent.id, agent.name, deleting, queryClient]);

  const fullPrompt = agent.prompt.trim() || "No prompt";
  const promptPreview = truncateText(fullPrompt, 50);
  const dryRunLabel = agent.dryRun ? "Enabled" : "Disabled";
  const connCount =
    agent.connectedAgentIds.length + agent.connectedChannelIds.length;

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
          {connCount} connection{connCount === 1 ? "" : "s"}
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

function ChannelNode({ data }: { data: GraphChannelNodeData }) {
  const channel = data.channel;
  const members = channel.memberAgentIds.length;
  return (
    <div className="relative min-w-52 rounded-lg border border-amber-400 bg-amber-50 p-3 shadow-sm dark:border-amber-700 dark:bg-amber-950/35">
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-amber-500 !bg-amber-300 dark:!border-amber-600 dark:!bg-amber-700"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-amber-500 !bg-amber-300 dark:!border-amber-600 dark:!bg-amber-700"
      />
      <div className="mb-1 truncate text-sm font-semibold text-amber-950 dark:text-amber-200">
        #{channel.name}
      </div>
      <div className="text-xs text-amber-900 dark:text-amber-300/90">
        {members} member{members === 1 ? "" : "s"}
      </div>
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode, channelNode: ChannelNode };

function RemovableConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: Edge<RemovableEdgeData> & {
  source: string;
  target: string;
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
            data?.onRemove?.();
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

function AgentGraphInner({ agents, channels }: AgentGraphProps) {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [mutating, setMutating] = useState(false);
  const [removingEdgeId, setRemovingEdgeId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useLayoutEffect(() => {
    setNodes((prev) => mergeReactFlowNodes(prev, agents, channels));
  }, [agents, channels, setNodes]);

  useLayoutEffect(() => {
    setEdges([
      ...buildAgentAgentEdges(agents),
      ...buildAgentChannelEdges(agents, channels),
    ]);
  }, [agents, channels, setEdges]);

  useLayoutEffect(() => {
    if (nodes.length === 0) return;
    const next: Record<string, XYPosition> = {};
    for (const node of nodes) {
      next[node.id] = node.position;
    }
    writeStoredPositions(next);
  }, [nodes]);

  const disconnectEdgeApi = useCallback(async (edge: Edge) => {
    if (edge.id.startsWith("ch::")) {
      const parts = edge.id.split("::");
      const agentId = parts[1];
      const channelId = parts[2];
      if (!agentId || !channelId) throw new Error("Invalid membership edge");
      await api.agentsIdChannelsChannelIdDelete({
        id: agentId,
        channelId,
      });
    } else if (edge.id.startsWith("peer::")) {
      const rest = edge.id.slice("peer::".length).split("::");
      const a = rest[0];
      const b = rest[1];
      if (!a || !b) throw new Error("Invalid peer edge");
      await api.agentsIdConnectionsPeerAgentIdDelete({
        id: a,
        peerAgentId: b,
      });
    }
  }, []);

  const removeConnection = useCallback(
    async (edge: Edge) => {
      if (mutating) return;
      setMutationError(null);
      setMutating(true);
      setRemovingEdgeId(edge.id);
      try {
        await disconnectEdgeApi(edge);
        invalidateAgentsAndChannelsQueries(queryClient);
      } catch (e) {
        setMutationError(
          e instanceof Error ? e.message : "Failed to remove connection",
        );
      } finally {
        setRemovingEdgeId(null);
        setMutating(false);
      }
    },
    [disconnectEdgeApi, mutating, queryClient],
  );

  const onConnect = useCallback(
    async (connection: { source: string | null; target: string | null }) => {
      const source = connection.source;
      const target = connection.target;
      if (!source || !target || source === target || mutating) return;

      const sa = rawAgentFromNode(source);
      const ta = rawAgentFromNode(target);
      const sc = rawChannelFromNode(source);
      const tc = rawChannelFromNode(target);

      setMutationError(null);
      setMutating(true);
      try {
        if (sa && ta) {
          await api.agentsIdConnectionsPost({
            id: sa,
            manageAgentConnectionBody: { peerAgentId: ta },
          });
        } else if (sa && tc) {
          await api.agentsIdChannelsPost({
            id: sa,
            manageAgentChannelBody: { channelId: tc },
          });
        } else if (sc && ta) {
          await api.agentsIdChannelsPost({
            id: ta,
            manageAgentChannelBody: { channelId: sc },
          });
        } else {
          return;
        }
        invalidateAgentsAndChannelsQueries(queryClient);
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
          await disconnectEdgeApi(edge);
        }
        invalidateAgentsAndChannelsQueries(queryClient);
      } catch (e) {
        setMutationError(
          e instanceof Error ? e.message : "Failed to remove connection",
        );
      } finally {
        setMutating(false);
      }
    },
    [disconnectEdgeApi, mutating, queryClient],
  );

  const onEdgeClick = useCallback<EdgeMouseHandler<Edge>>(
    (_event, edge) => {
      void removeConnection(edge);
    },
    [removeConnection],
  );

  const edgesWithHandlers = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "removableConnection",
        data: {
          onRemove: () => {
            void removeConnection(edge);
          },
          removing: removingEdgeId === edge.id,
        } satisfies RemovableEdgeData,
      })),
    [edges, removeConnection, removingEdgeId],
  );

  return (
    <div className="h-[68dvh] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>
          Arrange by dragging. Connect agents together, or connect an agent to a channel.
        </span>
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
