import RateLimit from 'express-rate-limit';
import Express from 'express';
import DotEnv from 'dotenv';
import Helmet from 'helmet';
import Fs from 'fs';

DotEnv.config(); // basically initialize dotenv

function limitHandler(req, res) {
  res.status(429).json({
    success: false,
    message: 'Too many requests! You have hit the rate limit.',
    limit: req.rateLimit.limit,
    current: req.rateLimit.current,
    remaining: req.rateLimit.remaining
  });
  res.end();
}

function skipHandler(req, res) {
  return (process.env.BYPASS_AUTH == req.get('Authorization'));
}

const app = Express();

const redditRateLimiter = RateLimit({
  windowMs: 20*1000,
  max: 3,
  skip: skipHandler,
  handler: limitHandler
});

const mcRateLimiter = RateLimit({
  windowMs: 30*1000,
  max: 3,
  skip: skipHandler,
  handler: limitHandler
});

app.use(Helmet());
app.use('/reddit', redditRateLimiter, require('./routes/reddit'));
app.use('/mc', mcRateLimiter, require('./routes/mc'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}.`);
});
