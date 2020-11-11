import RateLimit from 'express-rate-limit';
import Express from 'express';
import DotEnv from 'dotenv';
import Helmet from 'helmet';
import Fs from 'fs';

DotEnv.config(); // initialize dotenv

// import routes
import RedditRoutes from './routes/reddit.js';
import MCRoutes from './routes/mc.js';

function keyGenerator(req) {
  let cfConnecting = req.get('CF-Connecting-IP');

  if (cfConnecting) {
    return cfConnecting;
  } else {
    return req.ip;
  }
}

function limitHandler(req, res) { // handler for if rate limit is reached
  res.status(429).json({
    success: false,
    message: 'Too many requests! You have hit the rate limit.',
    limit: req.rateLimit.limit,
    current: req.rateLimit.current,
    remaining: req.rateLimit.remaining
  }).end();
}

function skipHandler(req, res) { // tell rate limiter whether to ignore that req or not
  return (process.env.BYPASS == req.get('Authorization'));
}

const redditRateLimiter = RateLimit({
  windowMs: 2.5*1000,
  max: 2,
  keyGenerator: keyGenerator,
  skip: skipHandler,
  handler: limitHandler
});

const mcRateLimiter = RateLimit({
  windowMs: 2.5*1000,
  max: 2,
  keyGenerator: keyGenerator,
  skip: skipHandler,
  handler: limitHandler
});

const app = Express();

app.use(Helmet());
app.use('/reddit', redditRateLimiter, RedditRoutes);
app.use('/mc', mcRateLimiter, MCRoutes);

app.use(function(req, res, next) { // handle 404s, must be last
  res.status(404).json({'message': 'Page not found'});
});

app.listen(process.env.PORT, function() {
  console.log(`Server running on port ${process.env.PORT}.`);
});
