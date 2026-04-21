const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776794249922.png';
    let img = await Jimp.read(source);
    
    console.log('IRON BRAIN FAVICON: AGGRESSIVE REINFORCEMENT...');

    // 1. CLEAN BACKGROUND & SOLIDIFY COLORS
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const r = img.bitmap.data[idx + 0];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;
      
      if (avg > 230) {
        img.bitmap.data[idx + 3] = 0;
      } else {
        // Boost saturated colors to solid for better extraction
        img.bitmap.data[idx + 3] = 255;
      }
    });

    const h = img.bitmap.height;
    img.crop({ x: 0, y: 0, w: img.bitmap.width, h: Math.floor(h * 0.45) });
    img.autocrop();
    
    // 2. AGGRESSIVE THICKENING (Line Expansion)
    // We create a clone and paint neighbors of colored pixels to thicken lines
    let thick = img.clone();
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      if (img.bitmap.data[idx + 3] === 255) {
        // Paint a 5x5 area around each pixel to make lines VERY thick
        for (let dx = -4; dx <= 4; dx++) {
          for (let dy = -4; dy <= 4; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < thick.bitmap.width && ny >= 0 && ny < thick.bitmap.height) {
              const nidx = (thick.bitmap.width * ny + nx) * 4;
              thick.bitmap.data[nidx + 0] = img.bitmap.data[idx + 0];
              thick.bitmap.data[nidx + 1] = img.bitmap.data[idx + 1];
              thick.bitmap.data[nidx + 2] = img.bitmap.data[idx + 2];
              thick.bitmap.data[nidx + 3] = 255;
            }
          }
        }
      }
    });

    // 3. ZERO PADDING & MAXIMUM FILL
    const size = 128;
    thick.contain({ w: size, h: size });
    
    // 4. MAXIMUM SATURATION & HIGH CONTRAST
    thick.color([
      { apply: 'saturate', params: [80] },
      { apply: 'darken', params: [15] }
    ]);
    
    // Final Edge Hardening
    thick.scan(0, 0, thick.bitmap.width, thick.bitmap.height, (x, y, idx) => {
      if (thick.bitmap.data[idx + 3] > 50) thick.bitmap.data[idx + 3] = 255;
      else thick.bitmap.data[idx + 3] = 0;
    });

    await thick.write('./public/favicon-sinapsi.png');

    console.log('IRON BRAIN GENERATED AT ./public/favicon-sinapsi.png');
    console.log('VERSION: v4 (AGGRESSIVE THICKENING)');
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
