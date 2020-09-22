const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

p = JSON.parse(Fs.readFileSync('private.json'));

const app = Express();

app.use(Helmet());
app.use(function(req, res, next){
  if (req.params.k == p.k) {
    next(); // move on to next middleware
  } else {
    res.status(401).end(); // 401 unauthed
  }
});

app.use('/mc', require('./routes/mc'));

app.listen(p.port, () => {
  console.log(`Server running on port ${p.port}.`);
});
