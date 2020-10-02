const RateLimit = require('express-rate-limit');
const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

require('dotenv').config(); // basically initialize dotenv

const app = Express();

app.use(Helmet());

function limitHandler(req, res) {
  if ()
}

app.use('/mc', RateLimit({windowMs: 30*1000, max: 2}), require('./routes/mc'));
app.use('/reddit', RateLimit({windowMs: 20*1000, max: 2}), require('./routes/reddit'));

app.listen(80, () => {
  console.log(`Server running on port ${80}.`);
});
