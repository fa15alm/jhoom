const express = require("express");
const protect = require("../middleware/auth.middleware");
const { chat, recommendations } = require("../controllers/coach.controller");

const router = express.Router();

router.post("/chat", protect, chat);
router.get("/recommendations", protect, recommendations);

module.exports = router;
