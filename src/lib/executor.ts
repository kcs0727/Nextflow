"use client";

import type { Edge } from "@xyflow/react";
import type { HistoryScope, HistoryStatus, NodeRunHistory, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { sortRunnableByLayers, useWorkflowStore } from "@/store/workflow-store";

function incomingEdges(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.target === nodeId);
}

function resolveInputs(node: WorkflowNode, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const inputs: Record<string, string | string[]> = { ...node.data.values };
  const incoming = incomingEdges(node.id, edges);

  for (const edge of incoming) {
    const source = nodes.find((n) => n.id === edge.source);
    if (!source || !edge.targetHandle) continue;

    const outputVal = source.data.outputs.output ?? source.data.values.output ?? "";

    if (edge.targetHandle === "images") {
      const existing = Array.isArray(inputs.images) ? inputs.images : inputs.images ? [String(inputs.images)] : [];
      inputs.images = [...existing, outputVal].filter(Boolean);
    } else {
      inputs[edge.targetHandle] = outputVal;
    }
  }

  return inputs;
}

function runStatusFromNodeRuns(nodeRuns: NodeRunHistory[]): HistoryStatus {
  const failed = nodeRuns.some((run) => run.status === "failed");
  if (!failed) return "success";
  const success = nodeRuns.some((run) => run.status === "success");
  return success ? "partial" : "failed";
}

export async function executeScope(scope: HistoryScope) {
  const store = useWorkflowStore.getState();
  
  // Auto-save workflow before running
  const { workflowId, workflowName, nodes: allNodes, edges: allEdges } = store;
  if (workflowId && workflowName) {
    try {
      await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId,
          name: workflowName,
          graph: { nodes: allNodes, edges: allEdges },
        }),
      });
    } catch (error) {
      console.error("Failed to auto-save workflow:", error);
    }
  }

  const runnable = store.getRunnableNodes(scope);
  if (!runnable.length) return;

  const nodes = store.nodes.filter((node) => runnable.some((r) => r.id === node.id));
  const edges = store.edges.filter(
    (edge) => nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target),
  );

  const layers = sortRunnableByLayers(nodes, edges);
  const nodeRuns: NodeRunHistory[] = [];
  const runStart = performance.now();

  for (const layer of layers) {
    await Promise.all(
      layer.map(async (node) => {
        const start = performance.now();
        useWorkflowStore.getState().setNodeStatus(node.id, "running");

        const inputs = resolveInputs(node, useWorkflowStore.getState().nodes, useWorkflowStore.getState().edges);

        try {
          const response = await fetch("/api/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: node.data.kind, inputs }),
          });
          const body = await response.json();

          if (!response.ok) {
            throw new Error(body.error ?? "Execution failed");
          }

          const outputs = (body.outputs ?? {}) as Record<string, string>;
          for (const [key, val] of Object.entries(outputs)) {
            useWorkflowStore.getState().setNodeOutput(node.id, key, val);
          }

          if (node.data.kind === "runAnyLlm") {
            useWorkflowStore.getState().setNodeInlineResult(node.id, outputs.output ?? "");
          }

          useWorkflowStore.getState().setNodeStatus(node.id, "success");
          nodeRuns.push({
            id: `${node.id}-${Date.now()}`,
            nodeId: node.id,
            nodeType: node.data.kind,
            status: "success",
            inputs,
            outputs,
            durationMs: Math.round(performance.now() - start),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          useWorkflowStore.getState().setNodeStatus(node.id, "failed", message);
          nodeRuns.push({
            id: `${node.id}-${Date.now()}`,
            nodeId: node.id,
            nodeType: node.data.kind,
            status: "failed",
            inputs,
            outputs: {},
            error: message,
            durationMs: Math.round(performance.now() - start),
          });
        }
      }),
    );
  }

  const durationMs = Math.round(performance.now() - runStart);
  const status = runStatusFromNodeRuns(nodeRuns);

  const historyEntry = {
    id: `run-${Date.now()}`,
    createdAt: new Date().toISOString(),
    scope,
    status,
    durationMs,
    selectedIds: scope !== "full" ? store.selectedNodeIds : undefined,
    nodeRuns,
  };

  useWorkflowStore.getState().addRunHistory(historyEntry);

  await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflowId: useWorkflowStore.getState().workflowId,
      scope,
      status,
      durationMs,
      selectedIds: historyEntry.selectedIds,
      nodeRuns,
    }),
  });
}
