/**
 * Browser-side helper that delegates actual upload to a server API route.
 */

export async function uploadViaTransloadit(
    file: File,
    acceptedMimes: string[],
): Promise<{ url: string; filename: string }> {
    if (!acceptedMimes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not supported`);
    }

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/transloadit/upload", {
        method: "POST",
        body,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to upload file via Transloadit");
    }

    const payload = (await response.json()) as { url?: string; filename?: string };

    if (!payload.url) {
        throw new Error("Transloadit did not return a hosted URL");
    }

    return {
        url: payload.url,
        filename: payload.filename ?? file.name,
    };
}


