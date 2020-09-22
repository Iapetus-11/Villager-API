const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

p = JSON.parse(Fs.readFileSync('private.json'));

const app = Express();

app.use(Helmet());
app.use(function(req, res, next){
  console.log(req.params.k);
  console.log(p.k);
  if (req.query.k == p.k) {
    next(); // move on to next middleware
  } else {
    res.status(401).end(); // 401 unauthed
  }
});

app.use('/mc', require('./routes/mc'));

app.listen(80, () => {
  console.log(`Server running on port ${80}.`);
});
