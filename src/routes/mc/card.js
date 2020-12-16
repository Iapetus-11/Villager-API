import express from 'express';
import canvas from 'canvas';
import fs from 'fs';

import {mcstatus} from '../../util/minecraft.js';
import {drawImage, drawText, roundEdges, sendImage} from '../../util/canvas.js';

const MCData = JSON.parse(fs.readFileSync('./src/mcdata.json'));
const router = express.Router();

canvas.registerFont('./src/assets/Minecraftia.ttf', {family: 'Minecraft', style: 'normal'});

async function drawMOTD(ctx, status) {
  let motd = status.motd;
  let motdVer;

  if (!motd) motd = 'A beautiful Minecraft server...';
  if (!status.online) motd = 'This server is offline.';

  // Determine what format the MOTD is in
  if (motd.extra && motd.extra.length) {
    motdVer = 'attributes_array';
  } else if (typeof(motd) != 'string' && motd.length) {
    motd = motd.join('');
    motdVer = 'rich_text';
  } else if (motd.text) {
    motd = motd.text;
    motdVer = 'rich_text';
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
    motd.extra.push(motd.text); // For consistency purpose

    for (let entry of motd.extra) {
      if (!entry.text) continue; // Check if there's actually text to draw

      // Change color if needed
      if (entry.color) {
        ctx.fillStyle = '#'.concat(MCData.minecraftColors[entry.color.toLowerCase()][2]);
      }

      if (entry.text.indexOf('\n') != -1) {
        drawnPixelsVerti += 27;
        drawnPixels = 0;
      }

      ctx.fillText(entry.text, 146+drawnPixels, 98+drawnPixelsVerti);
      drawnPixels += ctx.measureText(entry.text).width;
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

async function drawTopText(ctx, status, mcserver, customName) {
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'start';

  let top = 25;

  let nameWidth = drawText(ctx, (customName || mcserver), 146, top, 'Minecraft', '#FFF', 22, 324, 'start');
  let playerWidth = drawText(ctx, `${status.players_online}/${status.players_max}`, 762, top, 'Minecraft', '#FFF', 22, 999, 'end');

  if (status.online) {
    ctx.fillText(`${status.latency}ms`, ((140+nameWidth)+(768-playerWidth))/2, top);
  }
}

router.get('/:mcserver', async (req, res) => {
  let mcserver = req.params.mcserver;
  let customName = req.query.name;

  if (4 > mcserver.length > 150) {
    res.status(400).json({success: false, message: 'Bad Request - URL parameter mcserver is invalid'});
    return;
  }

  if (customName && 0 > customName.length > 50) {
    res.status(400).json({success: false, message: 'Bad Request - Query parameter name is invalid'});
    return;
  }

  let status = await mcstatus(mcserver);

  let image = canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  roundEdges(ctx, 0, 0, 768, 140, 3); // Make image corners rounded slightly

  // Settings I think are best for dealing with pixely images
  ctx.imageSmoothingEnabled = false;
  ctx.quality = 'nearest'; // Nearest neighbor is best for dealing with pixels, it's Minecraft
  ctx.patternQuality = 'nearest';

  await drawImage(ctx, './src/assets/dirt_background.png', 0, 0, 768, 140);

  let drawers = [
    drawMOTD(ctx, status),
    drawImage(ctx, (status.favicon || './src/assets/unknown_pack.png'), 6, 6, 128, 128),
    drawTopText(ctx, status, mcserver, customName)
  ];

  await Promise.all(drawers);
  sendImage(image, res, 'mcstatus.png');
});

export default router;
