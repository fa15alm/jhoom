const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.SMOKE_PORT || "5123";
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jhoom-smoke-"));
const dbPath = path.join(tmpRoot, "database.db");
const uploadDir = path.join(tmpRoot, "uploads");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await wait(250);
    }
  }

  throw new Error("Server did not become healthy in time");
}

async function request(baseUrl, pathName, options = {}) {
  const { headers, ...requestOptions } = options;
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...requestOptions,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${pathName} failed: ${data?.error || response.status}`);
  }

  return data;
}

async function run() {
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const server = spawn("node", ["server/src/server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      PORT,
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      JWT_SECRET: crypto.randomBytes(64).toString("hex"),
      DB_PATH: dbPath,
      UPLOAD_DIR: uploadDir,
      STATIC_DIR: "frontend/dist",
      PUBLIC_APP_URL: baseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.on("data", (data) => process.stdout.write(`[server] ${data}`));
  server.stderr.on("data", (data) => process.stderr.write(`[server] ${data}`));

  try {
    await waitForHealth(baseUrl);

    const suffix = crypto.randomBytes(4).toString("hex");
    const session = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: `smoke_${suffix}`,
        email: `smoke_${suffix}@example.com`,
        password: "password123",
      }),
    });

    const authHeaders = { Authorization: `Bearer ${session.token}` };
    const pixelPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

    await request(baseUrl, "/api/uploads/profile-photo", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ dataUrl: pixelPng, filename: "pixel.png" }),
    });

    await request(baseUrl, "/api/dashboard/summary", {
      headers: authHeaders,
    });

    await request(baseUrl, "/api/account/export", {
      headers: authHeaders,
    });

    console.log("Smoke checks passed.");
  } finally {
    server.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
