import RateLimit from 'express-rate-limit';
import Express from 'express';
import DotEnv from 'dotenv';
import Helmet from 'helmet';
import Fs from 'fs';

DotEnv.config(); // initialize dotenv

// import routes
//import RedditRoutes from './routes/reddit.js';
import MCRoutes from './routes/mc.js';

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
  return (process.env.BYPASS_AUTH == req.get('Authorization'));
}

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

const app = Express();

app.use(Helmet());
//app.use('/reddit', redditRateLimiter, RedditRoutes);
app.use('/mc', mcRateLimiter, MCRoutes);

app.listen(process.env.PORT, function() {
  console.log(`Server running on port ${process.env.PORT}.`);
});
