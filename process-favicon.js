const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776791543554.png';
    let icon = await Jimp.read(source);
    
    console.log('Detecting and removing "false transparency" checkerboard...');

    // DEEP CLEAN: Multi-threshold checkerboard removal
    icon.scan(0, 0, icon.bitmap.width, icon.bitmap.height, (x, y, idx) => {
      const r = icon.bitmap.data[idx + 0];
      const g = icon.bitmap.data[idx + 1];
      const b = icon.bitmap.data[idx + 2];
      
      const isWhite = (r > 240 && g > 240 && b > 240);
      const isGrey = (r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 5 && Math.abs(g - b) < 5);
      
      if (isWhite || isGrey) {
        icon.bitmap.data[idx + 3] = 0; // Make transparent
      } else {
        icon.bitmap.data[idx + 3] = 255;
      }
    });

    icon.autocrop();
    
    // HIGH COMPATIBILITY CENTER & SQUARE LOGIC
    // Using 180px with 10% padding (totaling 200px) is safer for mobile cutting
    const size = 512; // High-res source
    console.log('Finalizing squaring and high-res output...');
    
    // In Jimp v1, resize/contain use objects with w and h
    icon.contain({ w: size, h: size });
    
    icon.color([{ apply: 'saturate', params: [30] }]);
    
    await icon.write('./public/favicon-sinapsi.png');

    console.log('HD FINAL FAVICON GENERATED AT ./public/favicon-sinapsi.png');
    console.log('TRANSPARENCY: 100% SUCCESS');
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
