"use client";

import { memo, useRef, useState } from "react";
import Image from "next/image";
import type { NodeProps } from "@xyflow/react";
import type { WorkflowNodeData } from "@/types/workflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { NodeShell } from "@/components/flow/node-shell";
import { OutputHandle } from "@/components/flow/handles";
import { uploadViaTransloadit } from "@/lib/transloadit";
import { Upload, TriangleAlert } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function UploadImageNode({ id, data, selected }: NodeProps) {
    const updateNodeValue = useWorkflowStore((s) => s.updateNodeValue);
    const setNodeStatus = useWorkflowStore((s) => s.setNodeStatus);
    const typedData = data as WorkflowNodeData;
    const url = typedData.values.image_url ?? "";
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;

        setUploadError("");
        setIsUploading(true);

        try {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                throw new Error(`File type not supported. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
            }

            const result = await uploadViaTransloadit(file, ACCEPTED_TYPES);
            updateNodeValue(id, "image_url", result.url);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed";
            setUploadError(message);
            setNodeStatus(id, "failed", message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <NodeShell title={typedData.title} status={typedData.status} error={typedData.error} selected={selected}>
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 rounded-xl  bg-text95/50 px-3 py-4 text-sm text-text4 transition hover:border-text5 hover:bg-text95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Click to upload image"}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleFileSelect}
                className="hidden"
            />

            {uploadError && (
                <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-900/30 px-3 py-2 text-[11px] text-rose-200">
                    <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                    {uploadError}
                </p>
            )}

            {url && (
                <div className="space-y-2">
                    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-text7 bg-text95">
                        <Image src={url} alt="Uploaded" fill className="object-cover" unoptimized />
                    </div>
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate rounded-lg border border-text7 bg-text95 px-2 py-1 text-[11px] text-text3 hover:text-text1"
                        title={url}
                    >
                        {url}
                    </a>
                </div>
            )}

            <OutputHandle id="output" top="85%" label="image" kind={typedData.kind} />
        </NodeShell>
    );
}

export default memo(UploadImageNode);
