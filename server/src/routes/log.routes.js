const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");

const {
  getLogs,
  createLog,
  updateLog,
  deleteLog,
} = require("../controllers/log.controller");

//get all logs
router.get("/", protect, getLogs);

//create log
router.post("/", protect, createLog);

//update log
router.put("/:id", protect, updateLog);

//delete log
router.delete("/:id", protect, deleteLog);

module.exports = router;
