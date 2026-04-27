import type { Connection, Edge } from "@xyflow/react";
import type { PortType, WorkflowNode } from "@/types/workflow";

const INPUT_COMPAT: Record<string, Record<string, PortType>> = {
  runAnyLlm: {
    system_prompt: "text",
    user_message: "text",
    images: "image",
  },
  cropImage: {
    image_url: "image",
    x_percent: "text",
    y_percent: "text",
    width_percent: "text",
    height_percent: "text",
  },
  extractFrameFromVideo: {
    video_url: "video",
    timestamp: "text",
  },
};

const OUTPUT_KIND: Record<string, PortType> = {
  text: "text",
  uploadImage: "image",
  uploadVideo: "video",
  runAnyLlm: "text",
  cropImage: "image",
  extractFrameFromVideo: "image",
};

export function getNodeOutputType(nodeKind: string): PortType | null {
  return OUTPUT_KIND[nodeKind] ?? null;
}

export function getExpectedInputType(nodeKind: string, handleId?: string | null): PortType | null {
  if (!handleId) return null;
  return INPUT_COMPAT[nodeKind]?.[handleId] ?? null;
}

export function createsCycle(edges: Edge[], connection: Connection): boolean {
  if (!connection.source || !connection.target) return false;

  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const candidate = adjacency.get(connection.source) ?? [];
  candidate.push(connection.target);
  adjacency.set(connection.source, candidate);

  const seen = new Set<string>();
  const stack = new Set<string>();

  const dfs = (node: string): boolean => {
    if (stack.has(node)) return true;
    if (seen.has(node)) return false;

    seen.add(node);
    stack.add(node);

    for (const nxt of adjacency.get(node) ?? []) {
      if (dfs(nxt)) return true;
    }

    stack.delete(node);
    return false;
  };

  for (const node of adjacency.keys()) {
    if (dfs(node)) return true;
  }

  return false;
}

export function validateConnection(connection: Connection, nodes: WorkflowNode[], edges: Edge[]): boolean {
  const { source, target, targetHandle } = connection;
  if (!source || !target || source === target) return false;

  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  if (!sourceNode || !targetNode) return false;

  const fromType = getNodeOutputType(sourceNode.data.kind);
  const toType = getExpectedInputType(targetNode.data.kind, targetHandle);
  if (!fromType || !toType || fromType !== toType) return false;

  const singleInput = targetHandle !== "images";
  if (singleInput) {
    const existing = edges.find(
      (edge) => edge.target === target && edge.targetHandle === targetHandle,
    );
    if (existing) return false;
  }

  if (createsCycle(edges, connection)) return false;
  return true;
}

export function topologicalLayers(nodes: WorkflowNode[], edges: Edge[]): WorkflowNode[][] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  const queue = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);
  const layers: WorkflowNode[][] = [];

  while (queue.length > 0) {
    const currentLayer = [...queue];
    layers.push(currentLayer);
    queue.length = 0;

    for (const node of currentLayer) {
      for (const target of outgoing.get(node.id) ?? []) {
        const nextIncoming = (incoming.get(target) ?? 0) - 1;
        incoming.set(target, nextIncoming);
        if (nextIncoming === 0) {
          const nextNode = nodes.find((n) => n.id === target);
          if (nextNode) queue.push(nextNode);
        }
      }
    }
  }

  return layers;
}

export function upstreamSubgraph(nodeIds: string[], edges: Edge[]): Set<string> {
  const parents = new Map<string, string[]>();

  for (const edge of edges) {
    const list = parents.get(edge.target) ?? [];
    list.push(edge.source);
    parents.set(edge.target, list);
  }

  const out = new Set<string>(nodeIds);
  const stack = [...nodeIds];

  while (stack.length > 0) {
    const id = stack.pop() as string;
    for (const parent of parents.get(id) ?? []) {
      if (!out.has(parent)) {
        out.add(parent);
        stack.push(parent);
      }
    }
  }

  return out;
}
