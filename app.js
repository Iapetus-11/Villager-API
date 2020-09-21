const Express = require('express');
const Helmet = require('helmet');

const app = Express();

app.use(Helmet());

app.listen(2304, () => {
  console.log('Server running.');
});
