const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776794249922.png';
    let img = await Jimp.read(source);
    
    console.log('MAX VISIBILITY FAVICON PROCESSING...');

    // 1. CLEAN BACKGROUND
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const r = img.bitmap.data[idx + 0];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;
      if (avg > 230) img.bitmap.data[idx + 3] = 0;
      else img.bitmap.data[idx + 3] = 255;
    });

    // 2. TIGHT CROP (Only the brain)
    const h = img.bitmap.height;
    img.crop({ x: 0, y: 0, w: img.bitmap.width, h: Math.floor(h * 0.45) });
    img.autocrop();
    
    // 3. ZERO PADDING + MAXIMUM FILL
    // We want the brain to fill the square completely to be as big as possible in the tab
    const size = 128; // Standard HQ favicon size
    img.contain({ w: size, h: size });
    
    // 4. COLOR TURBO (For visibility at 16x16)
    img.color([
      { apply: 'saturate', params: [60] },
      { apply: 'darken', params: [10] } // Darken to make lines thicker/visible
    ]);
    
    // Final check for transparency edge artifacts
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      if (img.bitmap.data[idx + 3] > 0 && img.bitmap.data[idx + 3] < 255) {
        img.bitmap.data[idx + 3] = 255; // Remove semi-transparency for sharpness
      }
    });

    await img.write('./public/favicon-sinapsi.png');

    console.log('ULTRA-SHARP FAVICON GENERATED AT ./public/favicon-sinapsi.png');
    console.log('VERSION: v3 (MAX FILL)');
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
