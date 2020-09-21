const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

p = JSON.parse(Fs.readFileSync('private.json'));

const app = Express();

app.use(Helmet());
app.use(function(req, res, next){
  let ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

  if (p.allowed.includes(ip) || req.hostname.includes('discord.com') || req.hostname.includes('discordapp.com')) {
    next(); // move on to next middleware
  } else {
    res.status(401).end(); // 401 unauthed
  }
});

app.use('/mc', require('./routes/mc'));

app.listen(p.port, () => {
  console.log(`Server running on port ${p.port}.`);
});
