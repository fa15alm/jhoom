const express = require("express");
const protect = require("../middleware/auth.middleware");
const {
  uploadProfilePhoto,
  uploadSocialPostImage,
} = require("../controllers/upload.controller");

const router = express.Router();

router.post("/profile-photo", protect, uploadProfilePhoto);
router.post("/social-post-image", protect, uploadSocialPostImage);

module.exports = router;
