const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

const app = Express();
app.use(Helmet());

p = JSON.parse(Fs.readFileSync('private.json'))

app.use(function(req, res, next){
  let ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

  if (p.allowed.includes(ip)) {
    next();
  } else {
    res.status(401).end();
  }
});

app.listen(p.port, () => {
  console.log(`Server running on port ${p.port}.`);
});
