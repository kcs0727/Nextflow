"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { NodeShell } from "@/components/flow/node-shell";
import { OutputHandle } from "@/components/flow/handles";

function TextNode({ id, data, selected }: NodeProps) {
    const updateNodeValue = useWorkflowStore((s) => s.updateNodeValue);
    const typedData = data as WorkflowNodeData;
    const value = typedData.values.text ?? "";

    return (
        <NodeShell title={typedData.title} status={typedData.status} error={typedData.error} selected={selected}>
            <textarea
                value={value}
                onChange={(e) => updateNodeValue(id, "text", e.target.value)}
                placeholder="Enter text..."
                className="h-28 w-full resize-none rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5"
            />
            <OutputHandle id="output" top="80%" label="text" kind={typedData.kind} />
        </NodeShell>
    );
}

export default memo(TextNode);
