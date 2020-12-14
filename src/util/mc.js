import Canvas from 'canvas';
import Axios from 'axios';
import Fs from 'fs';

// utility stuff
import * as CnvsUtil from './canvas.js';

const mcData = JSON.parse(Fs.readFileSync('./src/mcdata.json'));
var statusesCache = {}; // {'server': { data }}

Canvas.registerFont('./src/assets/Minecraftia.ttf', {family: 'Minecraft', style: 'normal'});

function clearCacheLoop() {
  Object.keys(statusesCache)
  .forEach((mcserver, index) => {
    if ((new Date() - statusesCache[mcserver].cacheTime)/1000 >= 20) {
      delete statusesCache[mcserver];
    }
  });
}

setInterval(clearCacheLoop, 5000);

export function status(mcserver, stop) {
  return new Promise((resolve, reject) => {
    let cached = statusesCache[mcserver];

    if (!cached || (new Date() - cached.cacheTime)/1000 >= 20) {
      Axios.get('http://localhost:2304/mcstatus', {data: {mcserver: mcserver}})
        .then(resp => {
          if (!resp.data.motd && !stop) {
            resolve(status(mcserver, true));
          } else {
            let data = Object.assign(resp.data, {cached: false, cacheTime: null}); // poggers code lmao

            resolve(data);

            if (!stop) {
              statusesCache[mcserver] = Object.assign(Object.assign({}, resp.data), {cached: true, cacheTime: (new Date())});
            }
          }
        })
        .catch(e => reject(e));
    } else {
      resolve(cached);
    }
  });
}

async function drawCardText(ctx, status, mcserver, customName) {
  // determine whether motd is json or regular text
  let motd = status.motd;
  let motdVer = null;
  let tmp = null;

  if (motd == void(0) || motd == null) {
    motd = 'A beautiful Minecraft server...';
  }

  if (status.online != true) {
    motd = 'This server is offline.'
  }

  if (typeof motd == typeof []) { // determine what kind of motd it is
    try {
      tmp = motd.extra.length;
      motdVer = 'json_attributes_array';
    } catch(err) {
      motdVer = 'json_rich_array';
    }
  } else {
    motdVer = 'rich_text';
  }

  ctx.font = '22px "Minecraft"';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom';

  let defaultFont = '22px "Minecraft"';

  ctx.save() // save point we can restore to later

  if (motdVer == 'json_attributes_array') {
    let drawnPixels = 0;
    let drawnPixelsVerti = 0;
    let lastColor = 'white';
    let currentText = '';

    motd.extra.push(motd.text);

    for (let i = 0; i < motd.extra.length; i++) {
      if (motd.extra[i].color == void(0) || motd.extra[i].color == null) { // figure out color
        ctx.fillStyle = '#'.concat(mcData.minecraftColors[lastColor][2]); // if color field doesn't exist
      } else {
        ctx.fillStyle = '#'.concat(mcData.minecraftColors[motd.extra[i].color.toLowerCase()][2]); // if it does exit set it to the color
      }

      currentText = motd.extra[i].text; // set current text to draw to image

      if (currentText == void(0)) {
        continue;
      }

      if (currentText.indexOf('\n') != -1) { // keep track of space taken up by text already drawn
        drawnPixelsVerti += 5+22;
        drawnPixels = 0;
      }

      ctx.fillText(currentText, 146+drawnPixels, 98+drawnPixelsVerti);
      drawnPixels += ctx.measureText(currentText).width;
    }
  }

  if (motdVer == 'json_rich_array') {
    motdVer = 'rich_text';
    let newMotd = '';
    for (let i = 0; i < motd.length; motd++) {
      newMotd = newMotd.concat(motd[i]);
    }
    motd = newMotd;
  }

  if(motdVer == 'rich_text') { // motd is a string probably hopefully
    // ignore these comments, they're me thinking
    // essentially .split() but it treats color codes / formats as one character
    // let rawSplit = []; // ['§b', 'h', 'y', 'p', 'i', 'x', 'e', 'l', '§b', 's', 'u', 'c', 's']
    let drawnPixels = 0;
    let drawnPixelsVerti = 0;
    let currentColor = 'FFFFFF';
    let lastColor = 'FFFFFF';
    for (let i = 0; i < motd.length; i++) { // loop which does something like .split() but it treats color codes as one character
      if (motd.charAt(i) == '§') {
        try {
          currentColor = mcData.minecraftColorsCodes[motd.charAt(i+1).toLowerCase()][2];
          lastColor = currentColor;
        } catch(err) {
          currentColor = lastColor;
        }
        i++; // make sure to skip the actual character
      } else {
        if (motd.charAt(i) == void(0)) {
          continue;
        }

        if (motd.charAt(i).indexOf('\n') != -1) {
          drawnPixelsVerti += 5+22;
          drawnPixels = 0;
        }

        ctx.fillStyle = '#'.concat(currentColor);
        ctx.fillText(motd.charAt(i), 146+drawnPixels, 98+drawnPixelsVerti);
        drawnPixels += ctx.measureText(motd.charAt(i)).width;
      }
    }
  }

  // determine the value of serverName (customname or hostname + port)
  let serverName = mcserver;
  if (customName != null) {
    serverName = customName;
  }

  ctx.textAlign = 'start';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#FFF';

  // draw host name / server name in left corner ish
  // max width should be 328 px
  let defaultSize = 22;
  ctx.font = `${defaultSize}px "Minecraft"`;

  while (ctx.measureText(serverName).width > 324) {
    defaultSize -= .25;
    ctx.font = `${defaultSize}px "Minecraft"`;
  }

  ctx.fillText(serverName, 146, 50);
  let serverNameWidth = ctx.measureText(serverName).width;

  ctx.font = '22px "Minecraft"';

  // draw player count
  let rightMost;
  ctx.textAlign = 'end';
  if (status.online) {
    ctx.fillText(`${status.players_online}/${status.players_max}`, 768-6, 50);
    rightMost = ctx.measureText(`${status.players_online}/${status.players_max}`).width;
  } else {
    ctx.fillText('Offline', 768-6, 50);
    rightMost = ctx.measureText('Offline').width;
  }

  // draw latency or if server is online
  ctx.fillStyle = '#DDD';
  ctx.textAlign = 'center';
  if (status.online) {
    ctx.fillText(`${status.latency}ms`, ((128+6+6+serverNameWidth)+(768-rightMost))/2, 50);
  }
}

export function genStatusCard(mcserver, customName, status) {
  return new Promise((resolve, reject) => {
    let image = Canvas.createCanvas(768, 140);
    let ctx = image.getContext('2d');

    CnvsUtil.roundEdges(ctx, 0, 0, 768, 140, 3); // make image corners rounded slightly

    ctx.imageSmoothingEnabled = false;
    ctx.quality = 'nearest'; // nearest cause dealing with pixels cause Minecraft ya

    ctx.save(); // create restore point

    Canvas.loadImage('./src/assets/mcserver_background.png')
    .then(backgroundImage => {
      ctx.drawImage(backgroundImage, 0, 0, 768, 140);

      let drawers = [];

      drawers.push(CnvsUtil.drawImageAsync(ctx, (status.favicon ? status.favicon : './src/assets/unknown_pack.png'), 6, 6, 128, 128));
      drawers.push(drawCardText(ctx, status, mcserver, customName));

      Promise.all(drawers)
      .then(() => {
        resolve(image);
      })
      .catch(e => reject(e));
    })
    .catch(e => reject(e));
  });
}

export function genServerFavi(status) {
  return new Promise((resolve, reject) => {
    let image = Canvas.createCanvas(64, 64);
    let ctx = image.getContext('2d');

    CnvsUtil.drawImageAsync(ctx, (status.favicon ? status.favicon : './src/assets/unknown_pack.png'), 0, 0, 64, 64)
    .then(() => {
      resolve(image);
    })
    .catch(e => reject(e));
  });
}

export function genAchievement(text) {
  return new Promise((resolve, reject) => {
    let image = Canvas.createCanvas(320, 64);
    let ctx = image.getContext('2d');

    // We're dealing with inentionally pixely images so resizing should be nearest neighbor and smoothing should be off
    ctx.imageSmoothingEnabled = false;
    ctx.quality = 'nearest';
    ctx.patternQuality = 'nearest';
    ctx.textDrawingMode = 'glyph';

    ctx.save();

    CnvsUtil.drawImageAsync(ctx, './src/assets/achievement.png', 0, 0, 320, 64)
    .then(() => {
      CnvsUtil.drawTextAsync(ctx, text, 60, 45, 'Minecraft', '#FFF', 15, 250, 'left')
      .then(() => {
        resolve(image);
      })
      .catch(e => reject(e));
    })
    .catch(e => reject(e));
  });
}

export function genSplashScreen(text) {
  return new Promise((resolve, reject) => {
    let image = Canvas.createCanvas(512, 271);
    let ctx = image.getContext('2d');

    ctx.imageSmoothingEnabled = false;
    ctx.quality = 'nearest';
    ctx.patternQuality = 'nearest';
    ctx.textDrawingMode = 'glyph';

    ctx.save();

    CnvsUtil.drawImageAsync(ctx, './src/assets/mcsplash.png', 0, 0, 512, 271)
    .then(() => {
      ctx.rotate(-0.45);
      ctx.save();

      CnvsUtil.drawText(ctx, text, 370-65+1, 69+150+1, 'Minecraft', '#475C11', 12, 400, 'center');
      CnvsUtil.drawText(ctx, text, 370-65, 69+150, 'Minecraft', '#FFFF55', 12, 400, 'center');

      resolve(image);
    })
    .catch(e => reject(e));
  });
}
