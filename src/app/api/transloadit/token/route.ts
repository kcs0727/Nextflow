import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Transloadit } from "transloadit";

function getTemplateIdByMime(mimeType: string): string | undefined {
    if (mimeType.startsWith("image/")) {
        return process.env.TRANSLOADIT_TEMPLATE_ID_IMAGE;
    }

    if (mimeType.startsWith("video/")) {
        return process.env.TRANSLOADIT_TEMPLATE_ID_VIDEO;
    }

    return undefined;
}

function getTransloaditClient() {
    const authKey = process.env.TRANSLOADIT_AUTH_KEY;
    const authSecret = process.env.TRANSLOADIT_AUTH_SECRET;

    if (!authKey || !authSecret) {
        throw new Error("Transloadit credentials are missing. Set TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET.");
    }

    return new Transloadit({ authKey, authSecret });
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await request.json().catch(() => null)) as { mimeType?: string } | null;
        const mimeType = String(body?.mimeType ?? "");

        if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
            return NextResponse.json({ error: "Only image/video uploads are supported" }, { status: 400 });
        }

        const client = getTransloaditClient();
        const token = await client.mintBearerToken({
            aud: "api2",
            scope: ["assemblies:read", "assemblies:write"],
        });

        const templateId = getTemplateIdByMime(mimeType);
        if (!templateId) {
            return NextResponse.json({ error: "No Transloadit template configured for this file type" }, { status: 500 });
        }

        return NextResponse.json({
            accessToken: token.access_token,
            templateId,
            expiresIn: token.expires_in,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to mint Transloadit token";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}