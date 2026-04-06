const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
    getMyProfile,
    updateMyProfile,
    getUserProfile,
} = require("../controllers/profile.controller");

// Logged-in user's own profile
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// Public profile of another user
router.get("/:id", getUserProfile);

module.exports = router;