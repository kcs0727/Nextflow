import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { WorkflowNodeKind } from "@/types/workflow";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import "@/trigger/tasks";

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

const TRIGGER_POLL_TIMEOUT_MS = 30000;

async function pollRunWithTimeout(runId: string) {
    return await Promise.race([
        runs.poll(runId, { pollIntervalMs: 1000 }),
        new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        "Trigger task timed out while waiting for completion. Make sure the Trigger worker is running (`npm run trigger:dev`).",
                    ),
                );
            }, TRIGGER_POLL_TIMEOUT_MS);
        }),
    ]);
}

async function executeTriggerTask<TOutput>(taskId: string, payload: Record<string, unknown>) {
    const handle = await tasks.trigger(taskId, payload);
    const run = await pollRunWithTimeout(handle.id);

    if (run.status !== "COMPLETED") {
        throw new Error(run.error?.message ?? `Trigger task ${taskId} did not complete successfully`);
    }

    return run.output as TOutput;
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
        const outputs = await executeTriggerTask<Record<string, string>>(TASK_IDS[kind], {
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
        });

        return NextResponse.json({ outputs });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Trigger execution failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
