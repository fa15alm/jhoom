const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const env = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const logRoutes = require("./routes/log.routes");
const healthPlanRoutes = require("./routes/healthPlan.routes");
const milestoneRoutes = require("./routes/milestone.routes");
const coachRoutes = require("./routes/coach.routes");
const socialRoutes = require("./routes/social.routes");
const uploadRoutes = require("./routes/upload.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const accountRoutes = require("./routes/account.routes");
const { apiRateLimiter } = require("./middleware/rateLimit.middleware");

const app = express();

// Middleware
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json({ limit: env.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: env.jsonLimit }));

const uploadDir = path.isAbsolute(env.uploadDir)
  ? env.uploadDir
  : path.resolve(__dirname, "..", env.uploadDir);

fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir, {
  maxAge: env.nodeEnv === "production" ? "7d" : 0,
}));

app.get("/api", (req, res) => {
  res.json({ message: "Jhoom backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main API routes
app.use("/api", apiRateLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/health-plan", healthPlanRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/account", accountRoutes);

const staticDir = path.isAbsolute(env.staticDir)
  ? env.staticDir
  : path.resolve(__dirname, "../..", env.staticDir);
const staticIndexPath = path.join(staticDir, "index.html");

if (fs.existsSync(staticIndexPath)) {
  app.use(express.static(staticDir, {
    index: false,
    maxAge: env.nodeEnv === "production" ? "1d" : 0,
  }));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(staticIndexPath);
  });
}

module.exports = app;
