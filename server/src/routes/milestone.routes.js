const express = require("express");
const protect = require("../middleware/auth.middleware");
const {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require("../controllers/milestone.controller");

const router = express.Router();

router.get("/", protect, getMilestones);
router.post("/", protect, createMilestone);
router.put("/:id", protect, updateMilestone);
router.delete("/:id", protect, deleteMilestone);

module.exports = router;
