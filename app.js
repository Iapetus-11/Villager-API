const RateLimit = require('express-rate-limit');
const Express = require('express');
const Helmet = require('helmet');
const Fs = require('fs');

require('dotenv').config(); // basically initialize dotenv

const app = Express();

app.use(Helmet());

function skipHandler(req, res) {
  return (process.env.BYPASS_AUTH == req.get('Authorization'));
}

app.use('/reddit', RateLimit({windowMs: 20*1000, max: 2, skip: skipHandler}), require('./routes/reddit'));
app.use('/mc', RateLimit({windowMs: 30*1000, max: 2, skip: skipHandler}), require('./routes/mc'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}.`);
});
