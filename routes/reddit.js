const Express = require('express');
const Cheerio = require('cheerio');
const Axios = require('axios');

const router = Express.Router();

router.get('/gimme/:subreddits', (req, res) => {
  let url = 'https://reddit.com/r/' + req.params.subreddits;

  Axios.get(url)
  .then(redditRes => {
    if (redditRes.status != 200) {
      res.status(500).json({success: false, error: 'Response status code (from Reddit) was not 200 OK.'});
      return;
    }

    let images = Cheerio.load(redditRes.data)('._2_tDEnGMLxpM6uOa2kaDB3.ImageBox-image.media-element._1XWObl-3b9tPy64oaG6fax');

    res.status(200).json({success: true, imageUrl: images[Math.random() * images.length]});
  })
  .catch(e => console.log(e));
});

module.exports = router;
