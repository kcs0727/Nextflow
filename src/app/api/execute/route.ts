import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { WorkflowNodeKind } from "@/types/workflow";
import { runs, tasks } from "@trigger.dev/sdk/v3";

const payloadSchema = z.object({
    kind: z.enum([
        "text",
        "uploadImage",
        "uploadVideo",
        "runAnyLlm",
        "cropImage",
        "extractFrameFromVideo",
    ] as [WorkflowNodeKind, ...WorkflowNodeKind[]]),
    inputs: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

const TASK_IDS: Record<WorkflowNodeKind, string> = {
    text: "text-node",
    uploadImage: "upload-image-node",
    uploadVideo: "upload-video-node",
    runAnyLlm: "run-any-llm-node",
    cropImage: "crop-image-node",
    extractFrameFromVideo: "extract-frame-from-video-node",
};

function toExecutionPayload(inputs: Record<string, string | string[]>) {
    return {
        text: inputs.text,
        imageUrl: inputs.image_url,
        videoUrl: inputs.video_url,
        model: inputs.model,
        systemPrompt: inputs.system_prompt,
        userMessage: inputs.user_message,
        images: Array.isArray(inputs.images)
            ? inputs.images.map(String)
            : inputs.images
                ? [String(inputs.images)]
                : [],
        xPercent: inputs.x_percent,
        yPercent: inputs.y_percent,
        widthPercent: inputs.width_percent,
        heightPercent: inputs.height_percent,
        timestamp: inputs.timestamp,
    };
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { kind, inputs } = parsed.data;
    try {
        const handle = await tasks.trigger(TASK_IDS[kind], toExecutionPayload(inputs));
        return NextResponse.json({ runId: handle.id });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Trigger execution failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const runId = url.searchParams.get("runId");

    if (!runId) {
        return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    }

    try {
        const run = await runs.retrieve(runId);
        return NextResponse.json({
            status: run.status,
            isCompleted: run.isCompleted,
            isSuccess: run.isSuccess,
            output: run.output ?? null,
            error: run.error ?? null,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to retrieve Trigger run";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
