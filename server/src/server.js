const app = require("./app");
const env = require("./config/env");
const setupDb = require("./db/setupDb");

async function startServer() {
  await setupDb();

  const server = app.listen(Number(env.port), env.host, () => {
    console.log(`Server running at http://${env.host}:${env.port}`);
  });

  server.on("error", (error) => {
    console.error("Server failed while listening:", error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
