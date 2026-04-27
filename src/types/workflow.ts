import type { Edge, Node } from "@xyflow/react";

export const NODE_TYPES = [
  "text",
  "uploadImage",
  "uploadVideo",
  "runAnyLlm",
  "cropImage",
  "extractFrameFromVideo",
] as const;

export type WorkflowNodeKind = (typeof NODE_TYPES)[number];
export type PortType = "text" | "image" | "video";

export type NodeExecutionStatus = "idle" | "running" | "success" | "failed";

export type WorkflowNodeData = {
  title: string;
  kind: WorkflowNodeKind;
  values: Record<string, string>;
  outputs: Record<string, string>;
  connectedInputs: Record<string, boolean>;
  status: NodeExecutionStatus;
  error?: string;
  inlineResult?: string;
};

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export type HistoryScope = "full" | "single" | "partial";
export type HistoryStatus = "success" | "failed" | "partial" | "running";

export type NodeRunHistory = {
  id: string;
  nodeId: string;
  nodeType: WorkflowNodeKind;
  status: HistoryStatus;
  inputs: Record<string, string | string[]>;
  outputs: Record<string, string>;
  error?: string;
  durationMs: number;
};

export type WorkflowRunHistory = {
  id: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  scope: HistoryScope;
  status: HistoryStatus;
  durationMs: number;
  selectedCount?: number;
  nodeRuns: NodeRunHistory[];
};
