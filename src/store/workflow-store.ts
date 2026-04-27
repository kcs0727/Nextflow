"use client";

import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { createNode } from "@/lib/node-factory";
import { topologicalLayers, upstreamSubgraph, validateConnection } from "@/lib/graph";
import type {
  HistoryScope,
  NodeRunHistory,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeKind,
  WorkflowRunHistory,
} from "@/types/workflow";

type Snapshot = { nodes: WorkflowNode[]; edges: WorkflowEdge[] };

type WorkflowState = {
  workflowId?: string;
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeIds: string[];
  history: WorkflowRunHistory[];
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  setWorkflowName: (name: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => boolean;
  addNode: (kind: WorkflowNodeKind, at?: { x: number; y: number }) => void;
  deleteSelected: () => void;
  updateNodeValue: (nodeId: string, key: string, value: string) => void;
  setConnectedInput: (nodeId: string, key: string, connected: boolean) => void;
  setNodeOutput: (nodeId: string, key: string, value: string) => void;
  setNodeStatus: (nodeId: string, status: WorkflowNode["data"]["status"], error?: string) => void;
  setNodeInlineResult: (nodeId: string, inlineResult?: string) => void;
  undo: () => void;
  redo: () => void;
  loadGraph: (nodes: WorkflowNode[], edges: WorkflowEdge[], workflowId?: string, workflowName?: string) => void;
  getRunnableNodes: (scope: HistoryScope) => WorkflowNode[];
  getRunnableNodesBySelection: (ids: string[]) => WorkflowNode[];
  addRunHistory: (entry: WorkflowRunHistory) => void;
  setHistory: (history: WorkflowRunHistory[]) => void;
};

function copyGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): Snapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function pushUndo(state: WorkflowState): Pick<WorkflowState, "undoStack" | "redoStack"> {
  return {
    undoStack: [...state.undoStack, copyGraph(state.nodes, state.edges)].slice(-100),
    redoStack: [],
  };
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowName: "Untitled Workflow",
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  history: [],
  undoStack: [],
  redoStack: [],

  setWorkflowName: (workflowName) => set({ workflowName }),
  setSelectedNodeIds: (selectedNodeIds) => set({ selectedNodeIds }),

  onNodesChange: (changes) => {
    const state = get();
    set({
      nodes: applyNodeChanges(changes, state.nodes),
      ...pushUndo(state),
    });
  },

  onEdgesChange: (changes) => {
    const state = get();
    set({
      edges: applyEdgeChanges(changes, state.edges),
      ...pushUndo(state),
    });
  },

  onConnect: (connection) => {
    const state = get();
    if (!validateConnection(connection, state.nodes, state.edges)) return false;

    const edge: Edge = {
      id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
      source: connection.source!,
      sourceHandle: connection.sourceHandle,
      target: connection.target!,
      targetHandle: connection.targetHandle,
      animated: true,
    };

    set({
      edges: addEdge(edge, state.edges),
      nodes: state.nodes.map((node) => {
        if (node.id !== connection.target || !connection.targetHandle) return node;
        return {
          ...node,
          data: {
            ...node.data,
            connectedInputs: {
              ...node.data.connectedInputs,
              [connection.targetHandle]: true,
            },
          },
        };
      }),
      ...pushUndo(state),
    });

    return true;
  },

  addNode: (kind, at) => {
    const state = get();
    const position = at ?? { x: 280 + state.nodes.length * 40, y: 160 + state.nodes.length * 28 };
    set({
      nodes: [...state.nodes, createNode(kind, position.x, position.y)],
      ...pushUndo(state),
    });
  },

  deleteSelected: () => {
    const state = get();
    if (!state.selectedNodeIds.length) return;

    const selected = new Set(state.selectedNodeIds);
    const edges = state.edges.filter((e) => !selected.has(e.source) && !selected.has(e.target));

    const connectedInputsByNode = new Map<string, Record<string, boolean>>();
    for (const edge of edges) {
      if (!edge.targetHandle) continue;
      const val = connectedInputsByNode.get(edge.target) ?? {};
      val[edge.targetHandle] = true;
      connectedInputsByNode.set(edge.target, val);
    }

    set({
      nodes: state.nodes
        .filter((n) => !selected.has(n.id))
        .map((node) => ({
          ...node,
          data: {
            ...node.data,
            connectedInputs: connectedInputsByNode.get(node.id) ?? {},
          },
        })),
      edges,
      selectedNodeIds: [],
      ...pushUndo(state),
    });
  },

  updateNodeValue: (nodeId, key, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, values: { ...node.data.values, [key]: value } } }
          : node,
      ),
    }));
  },

  setConnectedInput: (nodeId, key, connected) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                connectedInputs: {
                  ...node.data.connectedInputs,
                  [key]: connected,
                },
              },
            }
          : node,
      ),
    }));
  },

  setNodeOutput: (nodeId, key, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                outputs: { ...node.data.outputs, [key]: value },
              },
            }
          : node,
      ),
    }));
  },

  setNodeStatus: (nodeId, status, error) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                status,
                error,
              },
            }
          : node,
      ),
    }));
  },

  setNodeInlineResult: (nodeId, inlineResult) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                inlineResult,
              },
            }
          : node,
      ),
    }));
  },

  undo: () => {
    const state = get();
    if (!state.undoStack.length) return;
    const prev = state.undoStack[state.undoStack.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, copyGraph(state.nodes, state.edges)],
    });
  },

  redo: () => {
    const state = get();
    if (!state.redoStack.length) return;
    const next = state.redoStack[state.redoStack.length - 1];
    set({
      nodes: next.nodes,
      edges: next.edges,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, copyGraph(state.nodes, state.edges)],
    });
  },

  loadGraph: (nodes, edges, workflowId, workflowName) => {
    set({
      workflowId,
      workflowName: workflowName ?? "Untitled Workflow",
      nodes,
      edges,
      undoStack: [],
      redoStack: [],
    });
  },

  getRunnableNodes: (scope) => {
    const state = get();
    if (scope === "full") return state.nodes;
    if (scope === "single") {
      const selected = state.nodes.filter((node) => state.selectedNodeIds.includes(node.id));
      return selected.length ? [selected[0]] : [];
    }

    return get().getRunnableNodesBySelection(state.selectedNodeIds);
  },

  getRunnableNodesBySelection: (ids) => {
    const state = get();
    if (!ids.length) return [];
    const subgraph = upstreamSubgraph(ids, state.edges);
    return state.nodes.filter((node) => subgraph.has(node.id));
  },

  addRunHistory: (entry) => set((state) => ({ history: [entry, ...state.history] })),
  setHistory: (history) => set({ history }),
}));

export function sortRunnableByLayers(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[][] {
  return topologicalLayers(nodes, edges);
}

export function nodeRunMap(nodeRuns: NodeRunHistory[]) {
  const map = new Map<string, NodeRunHistory>();
  for (const run of nodeRuns) map.set(run.nodeId, run);
  return map;
}
