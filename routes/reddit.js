const Express = require('express');
const Cheerio = require('cheerio');
const Axios = require('axios');

const router = Express.Router();

var imagesCache = [];
var lastUpdate;

router.get('/gimme/:subreddits', (req, res) => {
  let url = 'https://reddit.com/r/' + req.params.subreddits;

  Axios.get(url)
  .then(redditRes => {
    if (redditRes.status != 200) {
      res.status(500).json({success: false, error: 'Response status code (from Reddit) was not 200 OK.'});
      return;
    }

    if (((new Date()) - lastUpdate) / 1000 >= 30 || imagesCache.length < 1) { // update cache if last update 30 seconds or more ago or cache is empty
      let html = Cheerio.load(redditRes.data);
      let images = html('._2_tDEnGMLxpM6uOa2kaDB3.ImageBox-image.media-element._1XWObl-3b9tPy64oaG6fax');

      imagesCache = [];

      images.forEach(elem => imagesCache.push(elem.attribs.src));
    }

    res.status(200).json({success: true, imageUrl: imagesCache[Math.round(Math.random() * imagesCache.length)]});
  })
  .catch(e => console.log(e));
});

module.exports = router;
