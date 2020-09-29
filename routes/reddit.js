const Express = require('express');
const Axios = require('axios');

const router = Express.Router();

var imagesCache = []; // should be dictionary of lists {'subreddits': []}
var lastUpdate;

router.get('/gimme/:subreddits', (req, res) => {
  let subreddits = req.params.subreddits;

  if (((new Date()) - lastUpdate) / 1000 >= 30 || imagesCache[subreddits] == undefined || imagesCache[subreddits].length < 1) { // update cache if last update 30 seconds or more ago or cache is empty
    Axios.get(`https://reddit.com/r/${subreddits}/hot/.json?count=100`)
    .then(redditRes => {
      if (redditRes.status != 200) {
        res.status(500).json({success: false, error: 'Response status code (from Reddit) was not 200 OK.'});
        return;
      }

      imagesCache[subreddits] = [];
      let posts = redditRes.data.data.children;

      for (i = 0; i < posts.length; i++) {
        let postData = posts[i].data;

        if (!(postData.removal_reason || postData.is_video || postData.pinned || postData.stickied || postData.selftext)) {
          imagesCache[subreddits].push({
            id: postData.id,
            subreddit: postData.subreddit,
            author: postData.author,
            title: postData.title,
            permalink: postData.permalink,
            url: postData.url,
            upvotes: postData.ups,
            downs: postData.downs,
            nsfw: postData.over_18,
            spoiler: postData.spoiler
          });
        }
      }

      let post = imagesCache[subreddits][Math.floor(Math.random() * imagesCache.length)];
      res.status(200).json(Object.assign({}, {success: true}, post));
    })
    .catch(e => console.log(e));
  } else {
    let post = imagesCache[subreddits][Math.floor(Math.random() * imagesCache.length)];
    res.status(200).json(Object.assign({}, {success: true}, post));
  }
});

module.exports = router;
