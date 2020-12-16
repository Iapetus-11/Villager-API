import express from 'express';
import canvas from 'canvas';

import {mcstatus} from '../../util/minecraft.js';
import {drawImage, sendImage} from '../../util/canvas.js';

const router = express.Router();

router.get('/:mcserver', async (req, res) => {
  let mcserver = req.params.mcserver;

  if (4 > mcserver.length > 150) {
    res.status(400).json({success: false, message: 'Bad Request - URL parameter mcserver is invalid'});
    return;
  }

  let status = await mcstatus(mcserver);

  let image = canvas.createCanvas(64, 64);
  let ctx = image.getContext('2d');

  await drawImage(ctx, (status.favicon || './src/assets/unknown_pack.png'), 0, 0, 64, 64);
  sendImage(image, res, 'favicon.png');
});

export default router;
