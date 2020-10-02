
export function limitHandler(req, res) {
  res.status(429).json({
    success: false,
    message: 'Too many requests! You have hit the rate limit.',
    limit: req.rateLimit.limit,
    current: req.rateLimit.current,
    remaining: req.rateLimit.remaining
  });
  res.end();
}

export function skipHandler(req, res) {
  return (process.env.BYPASS_AUTH == req.get('Authorization'));
}

export const redditRateLimiter = RateLimit({
  windowMs: 20*1000,
  max: 3,
  skip: skipHandler,
  handler: limitHandler
});

export const mcRateLimiter = RateLimit({
  windowMs: 30*1000,
  max: 3,
  skip: skipHandler,
  handler: limitHandler
});
