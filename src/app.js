import RateLimit from 'express-rate-limit';
import Express from 'express';
import DotEnv from 'dotenv';
import Helmet from 'helmet';
import Fs from 'fs';

// import util
import * from './util/ratelimit.js';

// import routes
import redditRoutes from './routes/reddit.js';
import mcRoutes from './routes/mc.js';

DotEnv.config(); // initialize dotenv

const app = Express();

app.use(Helmet());
app.use('/reddit', redditRateLimiter, redditRoutes);
app.use('/mc', mcRateLimiter, mcRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}.`);
});
