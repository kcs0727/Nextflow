import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { uploadBufferViaTransloadit } from "@/lib/transloadit-server";

function getTemplateIdByMime(mimeType: string): string | undefined {
    if (mimeType.startsWith("image/")) {
        return process.env.TRANSLOADIT_TEMPLATE_ID_IMAGE;
    }
    if (mimeType.startsWith("video/")) {
        return process.env.TRANSLOADIT_TEMPLATE_ID_VIDEO;
    }
    return undefined;
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const rawFile = formData.get("file");

        if (!(rawFile instanceof File)) {
            return NextResponse.json({ error: "Missing file" }, { status: 400 });
        }

        const mimeType = rawFile.type;
        const isImage = mimeType.startsWith("image/");
        const isVideo = mimeType.startsWith("video/");

        if (!isImage && !isVideo) {
            return NextResponse.json({ error: "Only image/video uploads are supported" }, { status: 400 });
        }

        const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
        const templateId = getTemplateIdByMime(mimeType);
        const { url } = await uploadBufferViaTransloadit({
            buffer: fileBuffer,
            filename: rawFile.name || "upload.bin",
            templateId,
        });

        return NextResponse.json({
            url,
            filename: rawFile.name,
            mimeType,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Transloadit upload failed";
        const statusFromMessage =
            typeof message === "string" && message.includes("HTTP 400")
                ? 400
                : typeof message === "string" && message.includes("HTTP 401")
                    ? 401
                    : typeof message === "string" && message.includes("HTTP 403")
                        ? 403
                        : 500;

        return NextResponse.json({ error: message }, { status: statusFromMessage });
    }
}
