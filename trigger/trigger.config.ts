import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import "dotenv/config";

const projectRef = process.env.TRIGGER_PROJECT_REF;
if (!projectRef || !projectRef.startsWith("proj_")) {
  throw new Error(
    "Missing Trigger project ref. Set TRIGGER_PROJECT_REF in .env.local to your real value (starts with 'proj_').",
  );
}

export default defineConfig({
  project: projectRef,
  dirs: ["./src"],
  maxDuration: 300,
  build: {
    extensions: [
      additionalFiles({
        files: [
          "./node_modules/ffmpeg-static/ffmpeg.exe",
          "./node_modules/ffmpeg-static/index.js",
          "./node_modules/ffmpeg-static/package.json",
        ],
      }),
    ],
  },
});
