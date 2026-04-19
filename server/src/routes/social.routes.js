const express = require("express");
const protect = require("../middleware/auth.middleware");
const {
  searchUsers,
  getWeeklyFeed,
  createPost,
  getPostById,
  addComment,
  deleteComment,
  togglePostLike,
  getConnections,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  blockUser,
  reportContent,
} = require("../controllers/social.controller");
const { validateBody, oneOf, required } = require("../middleware/validate.middleware");

const router = express.Router();

router.get("/users", protect, searchUsers);
router.get("/feed/weekly", protect, getWeeklyFeed);
router.get("/posts/:postId", protect, getPostById);
router.post("/posts", protect, createPost);
router.post("/posts/:postId/comments", protect, addComment);
router.delete("/posts/:postId/comments/:commentId", protect, deleteComment);
router.post("/posts/:postId/like", protect, togglePostLike);
router.get("/friends", protect, getConnections);
router.post("/friends/:userId/request", protect, sendFriendRequest);
router.post(
  "/friends/:userId/respond",
  protect,
  validateBody({ action: oneOf(["accept", "decline"], "Action") }),
  respondToFriendRequest
);
router.delete("/friends/:userId", protect, removeFriend);
router.post("/friends/:userId/block", protect, blockUser);
router.post("/reports", protect, validateBody({ reason: required("Reason") }), reportContent);

module.exports = router;
