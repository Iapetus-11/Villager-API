import Express from 'express';
import Fs from 'fs';

// import utility functions
import * as CnvsUtil from '../util/canvas.js';
import * as MCUtil from '../util/mc.js';

const router = Express.Router();

router.get('/mcstatus/:mcserver', (req, res) => {
  let mcserver = req.params.mcserver;

  if (mcserver.length > 200) {
    res.status(400).json({success: false, message: 'The mcserver parameter must not be longer than 200 characters'});
    return;
  }

  if (mcserver.length < 5) {
    res.status(400).json({success: false, message: 'The mcserver parameter must be longer than 4 characters'});
    return;
  }

  MCUtil.status(mcserver)
  .then(status => {
    res.status(200).json(Object.assign({success: true}, status));
  })
  .catch(e => {
    console.log(e);
    res.status(500).json({success: false, message: 'Oops... Something went wrong on our end'});
  });
});

router.get('/servercard/:mcserver', (req, res) => {
  let customName = req.query.customname;
  let mcserver = req.params.mcserver;

  if (mcserver.length > 200) {
    res.status(400).json({success: false, message: 'The mcserver parameter must not be longer than 200 characters'});
    return;
  }

  if (mcserver.length < 5) {
    res.status(400).json({success: false, message: 'The mcserver parameter must be longer than 4 characters'});
    return;
  }

  MCUtil.status(mcserver)
  .then(status => {
    MCUtil.genStatusCard(mcserver, customName, status)
    .then(image => {
      CnvsUtil.sendImage(image, res, 'status.png');
    })
    .catch(e => {
      console.log(e);
      res.status(500).json({success: false, message: 'Oops... Something went wrong on our end'});
    });
  })
  .catch(e => {
    console.log(e);
    res.status(500).json({success: false, message: 'Oops... Something went wrong on our end'});
  });
});

router.get('/serverfavicon/:mcserver', (req, res) => {
  let mcserver = req.params.mcserver;

  if (mcserver.length > 200) {
    res.status(400).json({success: false, message: 'The mcserver parameter must not be longer than 200 characters'});
    return;
  }

  if (mcserver.length < 5) {
    res.status(400).json({success: false, message: 'The mcserver parameter must be longer than 4 characters'});
    return;
  }

  MCUtil.status(mcserver)
  .then(status => {
    MCUtil.genServerFavi(status)
    .then(image => {
      console.log('sending image');
      CnvsUtil.sendImage(image, res, 'server-icon.png');
    })
    .catch(e => {
      console.log(e);
      res.status(500).json({success: false, message: 'Oops... Something went wrong on our end'});
    });
  })
  .catch(e => {
    console.log(e);
    res.status(500).json({success: false, message: 'Oops... Something went wrong on our end'});
  });
});

export default router;
