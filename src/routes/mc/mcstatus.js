import express from 'express';

import {mcstatus} from '../../util/minecraft.js';

const router = express.Router();

router.get('/:mcserver', async (req, res) => {
  let mcserver = req.params.mcserver;

  if (4 > mcserver.length > 150) {
    res.status(400).json({success: false, message: 'Bad Request - URL parameter mcserver is invalid'});
    return;
  }

  let status = await mcstatus(mcserver);
  res.status(200).json({success: true, ...status});
});

export default router;
