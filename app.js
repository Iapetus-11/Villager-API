const Express = require('express');
const Helmet = require('helmet');

const app = Express();

app.use(Helmet());
app.use(function(req, res, next){
  let ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

  if ()
});

app.listen(2304, () => {
  console.log('Server running.');
});
