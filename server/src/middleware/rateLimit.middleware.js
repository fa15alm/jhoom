function createRateLimiter({ windowMs, max, message = "Too many requests. Try again soon." }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.originalUrl.split("?")[0]}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }

    next();
  };
}

const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
});

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many auth attempts. Wait a few minutes and try again.",
});

module.exports = {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
};
