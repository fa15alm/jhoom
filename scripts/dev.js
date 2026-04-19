const { spawn } = require("child_process");

const processes = [
  {
    name: "backend",
    command: "npm",
    args: ["--prefix", "server", "run", "dev"],
    env: {},
  },
  {
    name: "frontend",
    command: "npm",
    args: ["--prefix", "frontend", "run", "web"],
    env: {},
  },
];

let isShuttingDown = false;
const children = processes.map((item) => {
  const child = spawn(item.command, item.args, {
    cwd: process.cwd(),
    env: { ...process.env, ...item.env },
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${item.name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${item.name}] ${data}`);
  });

  child.on("exit", (code) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    children.forEach((runningChild) => {
      if (runningChild.pid !== child.pid) {
        runningChild.kill("SIGTERM");
      }
    });
    process.exit(code || 0);
  });

  return child;
});

function shutdown() {
  isShuttingDown = true;
  children.forEach((child) => child.kill("SIGTERM"));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
