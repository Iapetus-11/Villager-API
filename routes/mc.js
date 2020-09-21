const Axios = require('axios');
const Canvas = require('canvas');
const Express = require('express');
const RateLimit = require('express-rate-limit');
const Constants = require('../constants');

const router = Express.Router();

Canvas.registerFont(`${__dirname}/../assets/Minecraftia.ttf`, {family: 'Minecraft', style: 'normal'});

async function pingMCServer(host, port, doStop) {
  let data = await Axios.get('http://localhost:6942/mcping', {headers: {'host': host, 'port': port}});
  if(data.data.motd == void(0) && doStop == void(0)) {
    return await pingMCServer(host, port, true);
  }
  return data.data;
}

async function drawFavicon(ctx, faviData) {
  if (faviData != null) {
    Canvas.loadImage(faviData)
    .then(favi => { //    x  y
      ctx.drawImage(favi, 6, 6, 128, 128);
      return true;
    });
  } else {
    Canvas.loadImage(Constants.unknownPackData)
    .then(favi => {
      ctx.drawImage(favi, 6, 6, 128, 128);
      return true;
    });
  }
}

async function drawText(ctx, statusData, host, port, customName) {
  // determine whether motd is json or regular text
  let motd = statusData.motd;
  let motdVer = null;
  let tmp = null;

  if (motd == void(0) || motd == null) {
    motd = 'A beautiful Minecraft server...';
  }

  if (statusData.online != true) {
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

    for (i = 0; i < motd.extra.length; i++) {
      if (motd.extra[i].color == void(0) || motd.extra[i].color == null) { // figure out color
        ctx.fillStyle = '#'.concat(Constants.minecraftColors[lastColor][2]); // if color field doesn't exist
      } else {
        ctx.fillStyle = '#'.concat(Constants.minecraftColors[motd.extra[i].color.toLowerCase()][2]); // if it does exit set it to the color
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
    for (i = 0; i < motd.length; motd++) {
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
    for (i = 0; i < motd.length; i++) { // loop which does something like .split() but it treats color codes as one character
      if (motd.charAt(i) == '§') {
        try {
          currentColor = Constants.minecraftColorsCodes[motd.charAt(i+1).toLowerCase()][2];
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
  let serverName;
  if (customName != null) {
    serverName = customName;
  } else {
    serverName = host;
    if (!isNaN(port) && port != null && port != 0) {
      serverName = serverName.concat(`:${port}`);
    }
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
  if (statusData.online) {
    ctx.fillText(`${statusData.players_online}/${statusData.players_max}`, 768-6, 50);
    rightMost = ctx.measureText(`${statusData.players_online}/${statusData.players_max}`).width;
  } else {
    ctx.fillText('Offline', 768-6, 50);
    rightMost = ctx.measureText('Offline').width;
  }

  // draw latency or if server is online
  ctx.fillStyle = '#DDD';
  ctx.textAlign = 'center';
  if (statusData.online) {
    ctx.fillText(`${statusData.latency}ms`, ((128+6+6+serverNameWidth)+(768-rightMost))/2, 50);
  }
}

async function renderServerImage(host, port, customName, doStop) {
  let image = Canvas.createCanvas(768, 140);
  let ctx = image.getContext('2d');

  ctx.save(); // saves default ctx we can restore to later

  ctx.imageSmoothingEnabled = false;
  ctx.quality = 'nearest'; // nearest cause dealing with pixels cause Minecraft ya

  let bgImage = await Canvas.loadImage('assets/mcserver_background.png');
  ctx.drawImage(bgImage, 0, 0, 768, 140);

  let statusData = await pingMCServer(host, port); // "blocking" ping the mc server

  let drawFaviPromise = drawFavicon(ctx, statusData.favicon); // draw favicon to image

  //       ctx, motd,                   host, port, customName
  let drawTextPromise = drawText(ctx, statusData, host, port, customName); // draw a motd + server name

  await drawFaviPromise;
  await drawTextPromise;

  return image;
}

function handleRateLimit(req, res) {
  res.status(429).json({
    success: false,
    message: 'Rate limit was exceeded, try again later.',
    limit: req.rateLimit.limit,
    current: req.rateLimit.current,
    remaining: req.rateLimit.remaining
  });
}

router.get('/mcping', RateLimit({windowMs: 3000, max: 2, handler: handleRateLimit}) /* 2 every 3 sec*/, (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (host.length > 200) {
    res.status(400).json({success: false, message: 'The host field must be a string no longer than 200 characters.'});
    return;
  }

  if (port == null || isNaN(port)) {
    port = 0; // tells the mcping server that no port was specified.
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  for (i = 0; i < Constants.ipsToIgnore.length; i++) {
    if (host.indexOf(Constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  pingMCServer(host, port)
  .then(statusData => {
    statusData.success = true;
    res.json(statusData);
  })
  .catch(e => {
    console.log(e)
  });
});

router.get('/mcpingimg', RateLimit({windowMs: 5000, max: 2, handler: handleRateLimit}) /*2 every 5 sec*/, (req, res) => { // checks the status of an mc server and generates a pretty image
  let host = req.query.host;
  let port = parseInt(req.query.port);
  let imgOnly = req.query.imgonly;
  let customName = req.query.customname;

  if (customName != null && customName.length > 30) {
    res.status(400).json({success: false, message: 'The customname field must be a string no longer than 30 characters.'});
    return;
  }

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (host.length > 200) {
    res.status(400).json({success: false, message: 'The host field must be a string no longer than 200 characters.'});
    return;
  }

  if (port == null || isNaN(port)) {
    port = 0;
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  if (imgOnly != null && imgOnly != 'true' && imgOnly != 'false') {
    res.status(400).json({success: false, message: 'The imgonly field must be a string of the value \'true\' or \'false\''})
    return;
  }

  for (i = 0; i < Constants.ipsToIgnore.length; i++) {
    if (host.indexOf(Constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  renderServerImage(host, port, customName)
  .then(image => {
    if (imgOnly != 'true') {
      res.json({success: true, data: image.toDataURL()});
    } else {
      image.toBuffer((err, buffer) => { // send image/canvas straight from buffer (without saving image)
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment;filename=mcstatus.png',
          'Content-Length': buffer.length
        });
        res.end(Buffer.from(buffer, 'binary'));
      });
    }
  })
  .catch(e => {
    console.log(e);
  });
});

router.get('/serverfavi', RateLimit({windowMs: 4000, max: 2, handler: handleRateLimit}) /* 2 every 4 sec*/, (req, res) => { // checks the status of a minecraft server, takes query params host and port
  let host = req.query.host;
  let port = parseInt(req.query.port);

  if (host == null) {
    res.status(400).json({success: false, message: 'host is a required field.'});
    return;
  }

  if (host.length > 200) {
    res.status(400).json({success: false, message: 'The host field must be a string no longer than 200 characters.'});
    return;
  }

  if (port == null || isNaN(port)) {
    port = 0; // tells the mcping server that no port was specified.
  }

  if (port > 65535 || port < 0) {
    res.status(400).json({success: false, message: 'The port field must be an integer between 0 and 65535.'});
    return;
  }

  for (i = 0; i < Constants.ipsToIgnore.length; i++) {
    if (host.indexOf(Constants.ipsToIgnore[i]) != -1) {
      res.status(403).json({success: false, message: 'You cannot check the status of any Minecraft servers running on this port.'});
      return;
    }
  }

  pingMCServer(host, port)
  .then(statusData => {
    let image = Canvas.createCanvas(64, 64);
    let ctx = image.getContext('2d');

    Canvas.loadImage(statusData.favicon)
    .then(faviData => {
      ctx.drawImage(faviData, 0, 0);

      image.toBuffer((err, buffer) => {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment;filename=server-icon.png',
          'Content-Length': buffer.length
        });

        res.end(Buffer.from(buffer, 'binary'));
      });
    })
    .catch(e => {
      console.log(e);
    });
  })
  .catch(e => {
    console.log(e)
  });
});

module.exports = router;
