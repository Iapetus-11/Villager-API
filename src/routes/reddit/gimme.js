import express from 'express';
import axios from 'axios';

const router = express.Router();

let subredditCache = {}; // Should be object like {'subreddit': {lastUpdate: new Time(), urls: []}}

function clearSubredditCache() { // Clear outdated urls from the cache
  Object.keys(subredditCache).forEach(subreddit => {
    if ((new Date() - subredditCache[subreddit].lastUpdate)/1000 > 120) {
      delete subredditCache[subreddit];
    }
  });
}

setInterval(clearSubredditCache, 1000); // Clear subreddit cache every second

router.get('/gimme/:subreddits', async (req, res) => {
  let subreddits = req.params.subreddits; // Should be a string

  for (let c of subreddits.toLowerCase()) {  // Sanitize input
    if ('abcdefghijklmnopqrstuvwxyz+'.indexOf(c) == -1) {
      res.status(400).json({success: false, message: 'Bad Request - Body parameter subreddits is invalid'});
      return;
    }
  }

  if (subreddits.startsWith('+') || subreddits.endsWith('+')) {
    res.status(400).json({success: false, message: 'Bad Request - Body parameter subreddits is invalid'});
    return;
  }

  subredditList = subreddits.split('+');

  cached = [];
  subredditList.forEach(subreddit => {
    cached = [cached, ...(subredditCache[subreddit] || [])];
  });

  if (cached.length > 1) {
    let chosenSubreddit = subredditCache[subredditList[Math.floor(Math.random() * subredditList.length)]];
    let post = subredditCache[chosenSubreddit][Math.floor(Math.random() * subredditCache[chosenSubreddit].length)];
    post.success = true;
    res.status(200).json(post);
  } else {
    let redditRes = await axios.get(`https://reddit.com/r/${subreddits}/hot/.json?limit=5`);

    if (redditRes.status != 200) {
      res.status(400).json({success: false, message: 'Error - Something went wrong while contacting the Reddit API'});
      return;
    }
  }

});

export default router;
