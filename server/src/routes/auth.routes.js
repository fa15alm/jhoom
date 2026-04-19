const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/rateLimit.middleware");
const {
  validateBody,
  required,
  email,
  password,
} = require("../middleware/validate.middleware");
const {
  register,
  login,
  requestPasswordReset,
  confirmPasswordReset,
  requestEmailVerification,
  confirmEmailVerification,
} = require("../controllers/auth.controller");

// Register route
router.post(
  "/register",
  authRateLimiter,
  validateBody({
    username: required("Username"),
    email,
    password,
  }),
  register
);

// Login route
router.post(
  "/login",
  authRateLimiter,
  validateBody({
    email,
    password: required("Password"),
  }),
  login
);

router.post(
  "/password-reset/request",
  authRateLimiter,
  validateBody({ email }),
  requestPasswordReset
);

router.post(
  "/password-reset/confirm",
  authRateLimiter,
  validateBody({
    token: required("Reset token"),
    password,
  }),
  confirmPasswordReset
);

router.post("/email-verification/request", protect, requestEmailVerification);
router.post(
  "/email-verification/confirm",
  validateBody({ token: required("Verification token") }),
  confirmEmailVerification
);
router.get("/email-verification/confirm", confirmEmailVerification);

module.exports = router;
