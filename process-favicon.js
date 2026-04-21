const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    // USING THE TRUE HD SOURCE
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776794249922.png';
    let img = await Jimp.read(source);
    
    console.log('Extracting brain icon from HD source...');

    // CLEAN BACKGROUND (Aggressive near-white removal)
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const r = img.bitmap.data[idx + 0];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;
      
      if (avg > 240) {
        img.bitmap.data[idx + 3] = 0; // Transparent
      } else {
        img.bitmap.data[idx + 3] = 255;
      }
    });

    // CROP TO BRAIN (The top portion of the logo)
    const h = img.bitmap.height;
    img.crop({ x: 0, y: 0, w: img.bitmap.width, h: Math.floor(h * 0.45) });
    img.autocrop();
    
    // SQUARE AND RECENTER
    const size = 512;
    img.contain({ w: size, h: size });
    
    img.color([{ apply: 'saturate', params: [35] }]);
    
    await img.write('./public/favicon-sinapsi.png');

    console.log('CRYSTAL HD FAVICON GENERATED AT ./public/favicon-sinapsi.png');
    console.log('SUCCESS: NO MORE BLURRY PRINTS');
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
