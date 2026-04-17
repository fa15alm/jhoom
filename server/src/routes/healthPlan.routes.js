const express = require("express");
const router = express.Router();

//auth middleware protects all health plan routes
const protect = require("../middleware/auth.middleware");

//import controller functions
const {
  getHealthPlan,
  generateHealthPlan,
  updateHealthPlan,
} = require("../controllers/healthPlan.controller");

router.get("/", protect, getHealthPlan);
router.post("/generate", protect, generateHealthPlan);
router.put("/", protect, updateHealthPlan);

module.exports = router;
