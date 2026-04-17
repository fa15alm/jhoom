const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Jhoom backend is running");
});

// Health Plan routes
const healthPlanRoutes = require("./routes/healthPlan.routes");
app.use("/api/health-plan", healthPlanRoutes);

// Main API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

module.exports = app;
