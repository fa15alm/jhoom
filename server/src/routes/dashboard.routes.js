const express = require("express");
const protect = require("../middleware/auth.middleware");
const { getDashboardSummary } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);

module.exports = router;
