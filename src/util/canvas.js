
// make a rectangular clip with round edges on the given ctx
export function roundEdges(ctx, x, y, width, height, radius) { // def didn't steal this from code I did on disbots.gg hehe
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
}

export function drawTextAsync(ctx, text, x, y, fontName, color, defaultSize, maxWidth, alignment) {
  return new Promise((resolve, reject) => {
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.textAlign = alignment;

    ctx.font = `${defaultSize}px "${fontName}"`;

    // ensmallen the text till it fits lmao
    while (ctx.measureText(text).width > maxWidth) {
      defaultSize -= .1;
      ctx.font = `${defaultSize}px "${fontName}"`;
    }

    ctx.fillText(text, x, y);

    ctx.restore();
    resolve();
  });
}

// draw an image lol
export function drawImageAsync(ctx, src, x, y, width, height) {
  return new Promise((resolve, reject) => {
    let image = new Canvas.Image();

    image.onload = function() {
      ctx.drawImage(image, x, y, width, height);
      resolve();
    }

    image.src = src;
  });
}

// function to send an image easily
export function sendImage(image, res, fileName) {
  image.toBuffer((e, buffer) => { // this code will send the image straight from the buffer
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline;filename=${fileName}`, // inlinen or attachment
      'Content-Length': buffer.length
    }).end(Buffer.from(buffer, 'binary'));
  });
}
