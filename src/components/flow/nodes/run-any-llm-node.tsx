"use client";

import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { InputHandle, OutputHandle } from "@/components/flow/handles";
import { NodeShell } from "@/components/flow/node-shell";
import { ChevronDown } from "lucide-react";

function TextField({
    label,
    value,
    placeholder,
    disabled,
    onChange,
    rows = 3,
}: {
    label: string;
    value: string;
    placeholder: string;
    disabled?: boolean;
    onChange: (v: string) => void;
    rows?: number;
}) {
    return (
        <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-text4">{label}</span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                rows={rows}
                className="w-full resize-none rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5 disabled:cursor-not-allowed disabled:opacity-40"
            />
        </label>
    );
}

function RunAnyLlmNode({ id, data, selected }: NodeProps) {
    const updateNodeValue = useWorkflowStore((s) => s.updateNodeValue);
    const typedData = data as WorkflowNodeData;
    const [expandResult, setExpandResult] = useState(true);
    const imagePreviewUrls = (() => {
        const raw = typedData.outputs.images_preview;
        if (!raw) return [] as string[];

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [] as string[];
            return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
        } catch {
            return [] as string[];
        }
    })();

    const systemPromptConnected = Boolean(typedData.connectedInputs.system_prompt);
    const userMessageConnected = Boolean(typedData.connectedInputs.user_message);
    const imagesConnected = Boolean(typedData.connectedInputs.images);

    return (
        <NodeShell title={typedData.title} status={typedData.status} error={typedData.error} selected={selected}>
            {/* Input Handles with labels */}
            <InputHandle id="system_prompt" top="45%" label="system" kind={typedData.kind} tone="orange" />
            <InputHandle id="user_message" top="75%" label="message" kind={typedData.kind} tone="orange" />
            <InputHandle id="images" top="90%" label="images" kind={typedData.kind} />

            <div className="space-y-3">
                {/* Model Selector */}
                <label className="block space-y-1">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-text4">Model</span>
                    <select
                        value={typedData.values.model ?? "gemini-2.5-flash"}
                        onChange={(e) => updateNodeValue(id, "model", e.target.value)}
                        className="w-full rounded-xl border border-text7 bg-text95 px-3 py-2 text-sm text-text1 outline-none transition focus:border-text5"
                    >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                    </select>
                </label>

                {/* System Prompt Field */}
                <TextField
                    label={`System Prompt${systemPromptConnected ? " (connected)" : ""}`}
                    value={typedData.values.system_prompt ?? ""}
                    placeholder="Optional system instruction"
                    disabled={systemPromptConnected}
                    onChange={(v) => updateNodeValue(id, "system_prompt", v)}
                    rows={2}
                />

                {/* User Message Field */}
                <TextField
                    label={`User Message${userMessageConnected ? " (connected)" : ""}`}
                    value={typedData.values.user_message ?? ""}
                    placeholder="Required user message"
                    disabled={userMessageConnected}
                    onChange={(v) => updateNodeValue(id, "user_message", v)}
                    rows={2}
                />

                {/* Images Info */}
                <div className="text-[11px] text-text4">
                    {imagesConnected ? (
                        <p className="rounded-lg px-2 py-1 text-emerald-400">✓ Images connected</p>
                    ) : (
                        <p>Images input accepts multiple image connections</p>
                    )}
                </div>

                {imagePreviewUrls.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-text4">Connected Images</p>
                        <div className="grid grid-cols-3 gap-2">
                            {imagePreviewUrls.map((url, index) => (
                                <img
                                    key={`${url}-${index}`}
                                    src={url}
                                    alt={`Input ${index + 1}`}
                                    className="h-16 w-full rounded-lg border border-text7 bg-text95 object-cover"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Inline Result Display */}
                {typedData.inlineResult && (
                    <div className="space-y-2">
                        <button
                            onClick={() => setExpandResult(!expandResult)}
                            className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-200"
                        >
                            <ChevronDown
                                className={`h-3 w-3 transition-transform ${expandResult ? "rotate-180" : ""}`}
                            />
                            Response
                        </button>
                        {expandResult && (
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-emerald-600/40 bg-text95 p-3 text-xs leading-5 text-text1">
                                {typedData.inlineResult}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <OutputHandle id="output" top="92%" label="text" kind={typedData.kind} />
        </NodeShell>
    );
}

export default memo(RunAnyLlmNode);
