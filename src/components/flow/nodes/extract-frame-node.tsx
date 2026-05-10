"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { InputHandle, OutputHandle } from "@/components/flow/handles";
import { NodeShell } from "@/components/flow/node-shell";

function ExtractFrameNode({ id, data, selected }: NodeProps) {
  const updateNodeValue = useWorkflowStore((s) => s.updateNodeValue);
  const typedData = data as WorkflowNodeData;
  const videoConnected = Boolean(typedData.connectedInputs.video_url);
  const timestampConnected = Boolean(typedData.connectedInputs.timestamp);

    return (
      <NodeShell title={typedData.title} status={typedData.status} error={typedData.error} selected={selected}>
      {/* Input Handles */}
      <InputHandle id="video_url" top="35%" label="video" />
      <InputHandle id="timestamp" top="70%" label="time" />

      <div className="space-y-3">
        {/* Video URL Field */}
        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-text4">
            {videoConnected ? "Video (connected)" : "Video URL"}
          </span>
          <input
            type="url"
            value={typedData.values.video_url ?? ""}
            disabled={videoConnected}
            onChange={(e) => updateNodeValue(id, "video_url", e.target.value)}
            placeholder="Video URL"
            className="w-full rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        {/* Timestamp Field */}
        <label className="block space-y-1">
          <span className="text-[11px]  tracking-[0.14em] text-text4">
            {timestampConnected ? "TIMESTAMP(connected)" : "TIMESTAMP (Seconds or percentage)"}
          </span>
          <input
            value={typedData.values.timestamp ?? "0"}
            disabled={timestampConnected}
            onChange={(e) => updateNodeValue(id, "timestamp", e.target.value)}
            placeholder="(e.g., 0, 30, 50%)"
            className="w-full rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        {/* Info */}
        <p className="text-[11px] text-text4">Enter seconds (e.g., 5) or percentage (e.g., 25%)</p>

        {typedData.outputs.output && (
          <div className="space-y-2">
            <img
              src={typedData.outputs.output}
              alt="Extracted frame"
              className="h-28 w-full rounded-xl border border-text7 bg-text95 object-cover"
            />
            <a
              href={typedData.outputs.output}
              target="_blank"
              rel="noreferrer"
              className="block truncate rounded-lg border border-text7 bg-text95 px-2 py-1 text-[11px] text-text3 hover:text-text1"
              title={typedData.outputs.output}
            >
              {typedData.outputs.output}
            </a>
          </div>
        )}
      </div>

      <OutputHandle id="output" top="88%" label="image" />
    </NodeShell>
  );
}

export default memo(ExtractFrameNode);
