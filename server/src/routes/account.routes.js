const express = require("express");
const protect = require("../middleware/auth.middleware");
const { validateBody, required } = require("../middleware/validate.middleware");
const {
  exportAccountData,
  deleteAccount,
} = require("../controllers/account.controller");

const router = express.Router();

router.get("/export", protect, exportAccountData);
router.delete(
  "/me",
  protect,
  validateBody({ password: required("Password") }),
  deleteAccount
);

module.exports = router;
