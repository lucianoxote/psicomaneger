const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776802695708.png';
    let img = await Jimp.read(source);
    
    console.log('HARD RESET: GENERATING BRAND NEW SOLID ICON...');

    // 1. CLEAN BACKGROUND
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const r = img.bitmap.data[idx + 0];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;
      if (avg > 230) img.bitmap.data[idx + 3] = 0;
      else img.bitmap.data[idx + 3] = 255;
    });

    img.autocrop();
    const midPoint = img.bitmap.width / 2;

    // 2. AGGRESSIVE SOLID FILL
    let solid = img.clone();
    for (let i = 0; i < 40; i++) { // More iterations for absolute solidness
        let temp = solid.clone();
        solid.scan(0, 0, solid.bitmap.width, solid.bitmap.height, (x, y, idx) => {
            if (solid.bitmap.data[idx + 3] === 0) {
                const neighbors = [{x: x-1, y: y}, {x: x+1, y: y}, {x: x, y: y-1}, {x: x, y: y+1}];
                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < solid.bitmap.width && n.y >= 0 && n.y < solid.bitmap.height) {
                        const nidx = (solid.bitmap.width * n.y + n.x) * 4;
                        if (solid.bitmap.data[nidx + 3] === 255) {
                            temp.bitmap.data[idx + 3] = 255;
                            if (x < midPoint) {
                                temp.bitmap.data[idx+0] = 0; temp.bitmap.data[idx+1] = 162; temp.bitmap.data[idx+2] = 165;
                            } else {
                                temp.bitmap.data[idx+0] = 138; temp.bitmap.data[idx+1] = 58; temp.bitmap.data[idx+2] = 185;
                            }
                            break;
                        }
                    }
                }
            }
        });
        solid = temp;
    }

    // 3. ZERO MARGIN RESIZE
    solid.autocrop(); // Tight crop again after solidification
    const size = 128;
    solid.resize({ w: size, h: size }); // Force 1:1 filling the entire canvas
    
    solid.color([{ apply: 'saturate', params: [30] }]);
    
    const timestamp = Date.now();
    // UNIQUE NAME TO BYPASS ALL CACHES
    const targetName = `./public/brand_icon_sinapsi_v3.png`;
    await solid.write(targetName);

    console.log(`DEFEAT CACHE: SOLID ICON GENERATED AT ${targetName}`);
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
