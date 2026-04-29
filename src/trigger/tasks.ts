import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { uploadBufferViaTransloadit } from "@/lib/transloadit-server";

type ExecutionInputs = Record<string, string | string[]>;

async function downloadToFile(source: string, filePath: string) {
    if (source.startsWith("data:")) {
        const match = source.match(/^data:([^;]+);base64,([\s\S]*)$/);
        if (!match) {
            throw new Error("Unsupported data URL format");
        }

        await writeFile(filePath, Buffer.from(match[2], "base64"));
        return match[1];
    }

    const response = await fetch(source);
    if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const bytes = new Uint8Array(await response.arrayBuffer());
    await writeFile(filePath, bytes);
    return contentType;
}

function getFFmpegPath(): string {
    const candidates = [
        process.env.FFMPEG_BIN,
        process.env.FFMPEG_PATH,
        process.env.FFMPEG_FROM_ARGS,
        ffmpegPath,
        join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
        join(process.cwd(), "ffmpeg.exe"),
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
        if (!candidate) continue;

        // Command names like "ffmpeg" or "ffmpeg.exe" should be allowed without file checks.
        if (!candidate.includes("/") && !candidate.includes("\\")) {
            return candidate;
        }

        if (existsSync(candidate)) {
            return candidate;
        }
    }

    // Last resort: rely on PATH lookup.
    return process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
}

function runFfmpeg(args: string[]) {
    const binaryPath = getFFmpegPath();
    if (!binaryPath) {
        throw new Error("ffmpeg binary is not available");
    }

    return new Promise<void>((resolve, reject) => {
        const child = spawn(binaryPath, args, { stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(stderr.trim() || `ffmpeg exited with code ${code ?? -1}`));
        });
    });
}

function parsePercent(value: string, fallback: number) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return fallback;
    return Math.min(100, Math.max(0, numeric));
}

async function resolveVideoDurationSeconds(filePath: string) {
    const binaryPath = getFFmpegPath();
    if (!binaryPath) {
        throw new Error("ffmpeg binary is not available");
    }

    return new Promise<number>((resolve, reject) => {
        const child = spawn(binaryPath, ["-i", filePath], { stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", reject);
        child.on("close", () => {
            const match = stderr.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
            if (!match) {
                resolve(0);
                return;
            }

            const hours = Number(match[1]);
            const minutes = Number(match[2]);
            const seconds = Number(match[3]);
            resolve(hours * 3600 + minutes * 60 + seconds);
        });
    });
}

export const textNodeTask = task({
    id: "text-node",
    run: async (payload: { text?: string }) => {
        return { output: String(payload.text ?? "") };
    },
});

export const uploadImageTask = task({
    id: "upload-image-node",
    run: async (payload: { imageUrl?: string }) => {
        return { output: String(payload.imageUrl ?? "") };
    },
});

export const uploadVideoTask = task({
    id: "upload-video-node",
    run: async (payload: { videoUrl?: string }) => {
        return { output: String(payload.videoUrl ?? "") };
    },
});

export const runAnyLlmTask = task({
    id: "run-any-llm-node",
    run: async (payload: {
        model?: string;
        systemPrompt?: string;
        userMessage?: string;
        images?: string[];
    }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY.");
        }

        const userMessage = String(payload.userMessage ?? "");
        if (!userMessage.trim()) {
            throw new Error("LLM node requires a user message");
        }
  
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: String(process.env.GEMINI_MODEL ?? "gemini-3-flash-preview"),
            systemInstruction: payload.systemPrompt || undefined,
        });

        const images = Array.isArray(payload.images) ? payload.images : [];
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
            { text: userMessage },
        ];

        for (const imageUrl of images) {
            if (!imageUrl?.trim()) continue;

            const response = await fetch(imageUrl);
            if (!response.ok) {
                continue;
            }

            const contentType = response.headers.get("content-type") ?? "image/jpeg";
            const base64 = Buffer.from(await response.arrayBuffer()).toString("base64");
            parts.push({ inlineData: { mimeType: contentType, data: base64 } });
        }

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: parts as any }],
            });

            return {
                output: result.response.text(),
                images_preview: JSON.stringify(images),
            };
        } catch (error) {
            console.log("LLM Error:", error);
            
            // Check for quota/rate limit errors (multiple ways to detect)
            const isQuotaError = 
                (error instanceof Error && (
                    error.message.includes("429") || 
                    error.message.includes("quota") ||
                    error.message.toLowerCase().includes("quota") ||
                    error.message.includes("rate limit")
                )) ||
                (error && typeof error === 'object' && 'status' in error && (error as any).status === 429);
            
            if (isQuotaError) {
                console.log("Detected quota error - returning fallback message");
                return {
                    output:
                        "Gemini quota exceeded for this API key. Please set a billed GEMINI_API_KEY in your .env.local or upgrade your plan. For more info: https://ai.google.dev/gemini-api/docs/rate-limits",
                    images_preview: JSON.stringify(images),
                };
            }

            throw error;
        }
    },
});

export const cropImageTask = task({
    id: "crop-image-node",
    run: async (payload: {
        imageUrl?: string;
        xPercent?: string;
        yPercent?: string;
        widthPercent?: string;
        heightPercent?: string;
    }) => {
        const imageUrl = String(payload.imageUrl ?? "");
        if (!imageUrl) {
            throw new Error("Crop Image requires imageUrl");
        }

        const workingDir = await mkdtemp(join(tmpdir(), "nextflow-crop-"));
        const inputPath = join(workingDir, "input");
        const outputPath = join(workingDir, "output.png");

        try {
            await downloadToFile(imageUrl, inputPath);

            const x = parsePercent(String(payload.xPercent ?? "0"), 0);
            const y = parsePercent(String(payload.yPercent ?? "0"), 0);
            const width = Math.max(1, parsePercent(String(payload.widthPercent ?? "100"), 100));
            const height = Math.max(1, parsePercent(String(payload.heightPercent ?? "100"), 100));

            await runFfmpeg([
                "-y",
                "-i",
                inputPath,
                "-vf",
                `crop=iw*${width / 100}:ih*${height / 100}:iw*${x / 100}:ih*${y / 100}`,
                "-frames:v",
                "1",
                outputPath,
            ]);

            const outputBytes = await readFile(outputPath);
            const { url } = await uploadBufferViaTransloadit({
                buffer: outputBytes,
                filename: "cropped-image.png",
                templateId: process.env.TRANSLOADIT_TEMPLATE_ID_IMAGE,
            });

            return { output: url };
        } finally {
            await rm(workingDir, { recursive: true, force: true });
        }
    },
});

export const extractFrameTask = task({
    id: "extract-frame-from-video-node",
    run: async (payload: { videoUrl?: string; timestamp?: string }) => {
        const videoUrl = String(payload.videoUrl ?? "");
        if (!videoUrl) {
            throw new Error("Extract Frame requires videoUrl");
        }

        const workingDir = await mkdtemp(join(tmpdir(), "nextflow-frame-"));
        const inputPath = join(workingDir, "input");
        const outputPath = join(workingDir, "frame.jpg");

        try {
            await downloadToFile(videoUrl, inputPath);

            const timestamp = String(payload.timestamp ?? "0");
            let seekSeconds = Number(timestamp);

            if (timestamp.trim().endsWith("%")) {
                const duration = await resolveVideoDurationSeconds(inputPath);
                const percent = parsePercent(timestamp.replace("%", ""), 0);
                seekSeconds = duration > 0 ? (duration * percent) / 100 : 0;
            }

            if (Number.isNaN(seekSeconds) || seekSeconds < 0) {
                seekSeconds = 0;
            }

            await runFfmpeg([
                "-y",
                "-ss",
                String(seekSeconds),
                "-i",
                inputPath,
                "-frames:v",
                "1",
                "-q:v",
                "2",
                outputPath,
            ]);

            const frameBytes = await readFile(outputPath);
            const { url } = await uploadBufferViaTransloadit({
                buffer: frameBytes,
                filename: "extracted-frame.jpg",
                templateId: process.env.TRANSLOADIT_TEMPLATE_ID_IMAGE,
            });

            return { output: url };
        } finally {
            await rm(workingDir, { recursive: true, force: true });
        }
    },
});

export type TriggerNodeExecutionInput = ExecutionInputs;
