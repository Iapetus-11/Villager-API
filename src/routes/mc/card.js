import express from 'express';
import canvas from 'canvas';
import fs from 'fs';

import {mcstatus} from '../../util/minecraft.js';
import {drawImage, sendImage, roundEdges} from '../../util/canvas.js';

const MCData = JSON.parse(fs.readFileSync('./src/mcdata.json'));
const router = express.Router();

canvas.registerFont('./src/assets/Minecraftia.ttf', {family: 'Minecraft', style: 'normal'});

async function drawMOTD(ctx, status) {
  let motd = status.motd;
  let motdVer;

  if (!motd) motd = 'A beautiful Minecraft server...';
  if (!status.online) motd = 'This server is offline.';

  // Determine what format the MOTD is in
  if (typeof(motd) == []) {
    try {
      motd.extra.length;
      motdVer = 'attributes_array';
    } catch (error) {
      motd = motd.join('');
      motdVer = 'rich_text';
    }
  } else {
    motdVer = 'rich_text';
  }

  ctx.font = '22px "Minecraft"';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#'.concat(MCData.minecraftColors['white'][2]);

  let defaultFont = '22px "Minecraft"';
  let drawnPixels = 0;
  let drawnPixelsVerti = 0;

  if (motdVer == 'attributes_array') {
    let currentText = '';

    motd.extra.push(motd.text); // For consistency purposes

    for (let entry of motd.extra) {
      if (!entry.text) continue; // Check if there's actually text to draw

      // Change color if needed
      if (entry.color) {
        ctx.fillStyle = '#'.concat(MCData.minecraftColors[entry.color.toLowerCase()][2]);
      }

      if (currentText.indexOf('\n') != -1) {
        drawnPixelsVerti += 27;
        drawnPixels = 0;
      }

      ctx.fillText(currentText, 146+drawnPixels, 98+drawnPixelsVerti);
      drawnPixels += ctx.measureText(currentText).width;
    }
  } else {
    let newStyle;

    for (let i = 0; i < motd.length; i++) {
      if (motd.charAt(i) == '§') { // New color / formatting detected
        if (motd.charAt(i+1)) {
          newStyle = (MCData.minecraftColorsCodes[motd.charAt(i+1).toLowerCase()] || [])[2];
          if (newStyle) ctx.fillStyle = '#'.concat(newStyle);
        }

        i++; // Skip over character that was used to set color
      } else {
        if (motd.charAt(i).indexOf('\n') != -1) {
          drawnPixelsVerti += 27;
          drawnPixels = 0;
        }

        ctx.fillText(motd.charAt(i), 146+drawnPixels, 98+drawnPixelsVerti);
        drawnPixels += ctx.measureText(motd.charAt(i)).width;
      }
    }
  }
}

router.get('/:mcserver', async (req, res) => {
  let mcserver = req.params.mcserver;
  let customName = req.query.name;

  if (4 > mcserver.length > 150) {
    res.status(400).json({success: false, message: 'Bad Request - URL parameter mcserver is invalid'});
    return;
  }

  let status = await mcstatus(mcserver);

  let image = Canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  roundEdges(ctx, 0, 0, 768, 140, 3); // Make image corners rounded slightly

  ctx.imageSmoothingEnabled = false; // Best for dealing with pixels
  ctx.quality = 'nearest'; // Nearest neighbor is best for dealing with pixels, it's Minecraft

  await drawImage(ctx, './src/assets/dirt_background.png', 0, 0, 768, 140);


});

export default router;
