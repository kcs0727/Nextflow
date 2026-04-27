import { Transloadit } from "transloadit";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function getTransloaditClient() {
    const authKey = process.env.TRANSLOADIT_AUTH_KEY;
    const authSecret = process.env.TRANSLOADIT_AUTH_SECRET;

    if (!authKey || !authSecret) {
        throw new Error("Transloadit credentials are missing. Set TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET.");
    }

    return new Transloadit({ authKey, authSecret });
}

function extractAssemblyResultUrl(assembly: unknown): string | null {
    if (!assembly || typeof assembly !== "object") return null;
    const typed = assembly as {
        uploads?: Array<{ ssl_url?: string | null; url?: string | null }>;
        results?: Record<string, Array<{ ssl_url?: string | null; signed_ssl_url?: string | null; url?: string | null }>>;
    };

    for (const upload of typed.uploads ?? []) {
        if (upload.ssl_url) return upload.ssl_url;
        if (upload.url) return upload.url;
    }

    for (const entries of Object.values(typed.results ?? {})) {
        for (const item of entries ?? []) {
            if (item.signed_ssl_url) return item.signed_ssl_url;
            if (item.ssl_url) return item.ssl_url;
            if (item.url) return item.url;
        }
    }

    return null;
}

export async function uploadBufferViaTransloadit(options: {
    buffer: Buffer;
    filename: string;
    templateId?: string;
}) {
    const { buffer, filename, templateId } = options;
    const client = getTransloaditClient();

    const workingDir = await mkdtemp(join(tmpdir(), "nextflow-transloadit-"));
    const inputPath = join(workingDir, filename);

    try {
        await writeFile(inputPath, buffer);
      
        const params = templateId
            ? { template_id: templateId }
            : {
                // Transloadit requires either template_id or steps.
                // This fallback keeps uploads working even when template IDs are not configured.
                steps: {
                    ":original": {
                        robot: "/upload/handle",
                        result: true,
                    },
                },

            };

        const assembly = await client.createAssembly({
            files: { original: inputPath },
            params,
            waitForCompletion: true,
        });

        const url = extractAssemblyResultUrl(assembly);
        if (!url) {
            throw new Error("Transloadit did not return a usable file URL");
        }

        return { url, assembly };
    } finally {
        await rm(workingDir, { recursive: true, force: true });
    }
}