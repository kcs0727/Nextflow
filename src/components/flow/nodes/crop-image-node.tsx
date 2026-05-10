"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { InputHandle, OutputHandle } from "@/components/flow/handles";
import { NodeShell } from "@/components/flow/node-shell";

function NumberField({
    label,
    keyName,
    data,
    id,
    placeholder,
}: {
    label: string;
    keyName: string;
    data: WorkflowNodeData;
    id: string;
    placeholder: string;
}) {
    const updateNodeValue = useWorkflowStore((s) => s.updateNodeValue);
    const disabled = Boolean(data.connectedInputs[keyName]);

    return (
        <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-text4">{label}</span>
            <input
                type="number"
                value={data.values[keyName] ?? ""}
                onChange={(e) => updateNodeValue(id, keyName, e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                min="0"
                max="100"
                className="w-full rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5 disabled:cursor-not-allowed disabled:opacity-40"
            />
        </label>
    );
}

function CropImageNode({ id, data, selected }: NodeProps) {
    const updateNodeValue = useWorkflowStore((s) => s.updateNodeValue);
    const typedData = data as WorkflowNodeData;
    const imageConnected = Boolean(typedData.connectedInputs.image_url);

    return (
        <NodeShell title={typedData.title} status={typedData.status} error={typedData.error} selected={selected}>
            {/* Input Handles */}
            <InputHandle id="image_url" top="28%" label="image" kind={typedData.kind} />
            <InputHandle id="x_percent" top="48%" label="x %" kind={typedData.kind} tone="orange" />
            <InputHandle id="y_percent" top="58%" label="y %" kind={typedData.kind} tone="orange" />
            <InputHandle id="width_percent" top="68%" label="width %" kind={typedData.kind} tone="orange" />
            <InputHandle id="height_percent" top="78%" label="height %" kind={typedData.kind} tone="orange" />

            <div className="space-y-3">
                {/* Image URL Field */}
                <label className="block space-y-1">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-text4">
                        {imageConnected ? "Image (connected)" : "Image URL"}
                    </span>
                    <input
                        type="url"
                        value={typedData.values.image_url ?? ""}
                        disabled={imageConnected}
                        onChange={(e) => updateNodeValue(id, "image_url", e.target.value)}
                        placeholder="Image URL"
                        className="w-full rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                </label>

                {/* Crop Parameters Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <NumberField label="X %" keyName="x_percent" data={typedData} id={id} placeholder="0" />
                    <NumberField label="Y %" keyName="y_percent" data={typedData} id={id} placeholder="0" />
                    <NumberField
                        label="Width %"
                        keyName="width_percent"
                        data={typedData}
                        id={id}
                        placeholder="100"
                    />
                    <NumberField
                        label="Height %"
                        keyName="height_percent"
                        data={typedData}
                        id={id}
                        placeholder="100"
                    />
                </div>

                {/* Info */}
                <p className="text-[11px] text-text4">Crop area: 0-100% for each parameter</p>

                {typedData.outputs.output && (
                    <div className="space-y-2">
                        <img
                            src={typedData.outputs.output}
                            alt="Cropped output"
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

            <OutputHandle id="output" top="92%" label="image" kind={typedData.kind} />
        </NodeShell>
    );
}

export default memo(CropImageNode);
