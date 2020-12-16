import express from 'express';
import axios from 'axios';

const router = express.Router();

let subredditCache = {}; // Should be object like {'subreddit': {lastUpdate: new Time(), posts: []}}

function clearSubredditCache() { // Clear outdated posts from the cache
  Object.keys(subredditCache).forEach(subreddit => {
    if ((new Date() - subredditCache[subreddit].lastUpdate)/1000 > 120) {
      delete subredditCache[subreddit];
    }
  });
}

setInterval(clearSubredditCache, 1000); // Clear subreddit cache every second

async function fetchRedditPosts(subreddits, limit) {
  let res = await axios.get(`https://reddit.com/r/${subreddits}/hot/.json?limit=${limit}`);
  let posts = [];

  if (res.status != 200) {
    return false;
  }

  res.data.data.children.forEach(p => {
    p = p.data;
    if (!(p.removal_reason || p.is_video || p.pinned || p.stickied || p.selftext)) {
      if (p.url && ['.png', '.jpg', '.gif', 'jpeg'].includes(p.url.slice(-4))) {
        posts.push({
          id: p.id,
          subreddit: p.subreddit,
          author: p.author,
          title: p.title,
          permalink: 'https://reddit.com' + p.permalink,
          url: p.url,
          upvotes: p.ups,
          downvotes: p.downs,
          nsfw: p.over_18,
          spoiler: p.spoiler
        });
      }
    }
  });

  return posts;
}

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

  let subredditList = subreddits.split('+');

  let cached = [];
  subredditList.forEach(subreddit => {
    cached = [cached, ...((subredditCache[subreddit] || Object()).posts || [])];
  });

  if (cached.length > 1) {
    let post = cached[Math.floor(Math.random() * cached.length)];
    post.success = true;
    res.status(200).json(post);
  } else {
    let posts = await fetchRedditPosts(subreddits, 5);

    if (!posts) {
      res.status(400).json({success: false, message: 'Error - Something went wrong while contacting the Reddit API'});
      return;
    }

    if (!posts.length) {
      res.status(400).json({success: false, message: 'Error - No valid posts found'});
      return;
    }

    res.status(200).json({success: true, ...posts[Math.floor(Math.random() * posts.length)]});

    let tempCache = {};

    (await fetchRedditPosts(subreddits, 175)).forEach(post => {
      if (tempCache[post.subreddit]) {
        tempCache[post.subreddit].posts.push(post);
      } else {
        tempCache[post.subreddit] = {lastUpdate: new Date(), posts: [post]};
      }
    });

    Object.assign(subredditCache, tempCache);
  }
});

export default router;
