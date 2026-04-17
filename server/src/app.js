const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logs routes (user activity tracking: workout, sleep, nutrition, etc.)
const logRoutes = require("./routes/log.routes");
app.use("/api/logs", logRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Jhoom backend is running");
});

// Main API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

module.exports = app;
