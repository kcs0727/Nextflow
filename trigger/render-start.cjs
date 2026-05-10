const http = require("node:http");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT || 10000);
const healthServer = http.createServer((request, response) => {
  if (request.url === "/health" || request.url === "/") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
});

healthServer.listen(port, "0.0.0.0", () => {
  console.log(`Health server listening on ${port}`);
});

const childEnv = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=384",
};

const triggerCommand = process.platform === "win32" 
  ? "npx trigger dev --skip-update-check --skip-telemetry --log-level error --max-concurrent-runs 1"
  : "trigger dev --skip-update-check --skip-telemetry --log-level error --max-concurrent-runs 1";

const child = spawn(triggerCommand, {
  stdio: "inherit",
  env: childEnv,
  shell: true,
});

const shutdown = () => {
  child.kill("SIGTERM");
  healthServer.close(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

child.on("exit", (code) => {
  healthServer.close(() => process.exit(code ?? 0));
});
