const RateLimit = require('express-rate-limit');
const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

const app = Express();

app.use(Helmet());

// old auth system
// app.use(function(req, res, next){
//   if (req.get('Authorization') == p.auth || (req.query.k == p.query_k && ['/mc/mcpingimg', '/mc/serverfavi'].includes(req.path))) {
//     next(); // move on to next middleware
//   } else {
//     res.status(401).end(); // 401 unauthed
//   }
// });

app.use('/mc', RateLimit({windowMs: 30*1000, max: 2}), require('./routes/mc'));
app.use('/reddit', RateLimit({windowMs: 20*1000, max: 2}), require('./routes/reddit'));

app.listen(80, () => {
  console.log(`Server running on port ${80}.`);
});
