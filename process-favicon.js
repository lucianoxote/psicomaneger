const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776802695708.png';
    let img = await Jimp.read(source);
    
    console.log('SURGERY: EXTRACTING CLEAN BRAIN SILHOUETTE...');

    // 1. CREATE A PERFECT MASK (White = Brain, Transparent = Background)
    // We clean the background and solidify the mask
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const r = img.bitmap.data[idx + 0];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;
      
      if (avg > 240) {
        img.bitmap.data[idx + 3] = 0; // Pure Transparent
      } else {
        img.bitmap.data[idx + 3] = 255; // Pure Opaque (Mask)
      }
    });

    img.autocrop();
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    const midPoint = w / 2;

    // 2. CREATE SOLID COLOR CORE
    // Instead of flood-filling, we paint a solid canvas and then apply the brain mask
    let result = img.clone();
    result.scan(0, 0, w, h, (x, y, idx) => {
      if (result.bitmap.data[idx + 3] === 255) {
        if (x < midPoint) {
           // Teal #00a2a5
           result.bitmap.data[idx+0] = 0;
           result.bitmap.data[idx+1] = 162;
           result.bitmap.data[idx+2] = 165;
        } else {
           // Purple #8a3ab9
           result.bitmap.data[idx+0] = 138;
           result.bitmap.data[idx+1] = 58;
           result.bitmap.data[idx+2] = 185;
        }
      }
    });

    // 3. REINFORCE EDGES (Thickening just a little bit for micro-scale visibility)
    // We do one step of expansion to make the wavy silhouette "stronger"
    let final = result.clone();
    result.scan(0, 0, w, h, (x, y, idx) => {
      if (result.bitmap.data[idx + 3] === 255) {
        for (let dx = -3; dx <= 3; dx++) {
          for (let dy = -3; dy <= 3; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nidx = (w * ny + nx) * 4;
                if (final.bitmap.data[nidx + 3] === 0) {
                    final.bitmap.data[nidx + 0] = result.bitmap.data[idx + 0];
                    final.bitmap.data[nidx + 1] = result.bitmap.data[idx + 1];
                    final.bitmap.data[nidx + 2] = result.bitmap.data[idx + 2];
                    final.bitmap.data[nidx + 3] = 255;
                }
            }
          }
        }
      }
    });

    // 4. SMART RESIZE (Keep Aspect Ratio, No Margins)
    const size = 128;
    // We resize to maximum dimension and then fit into square without padding
    final.autocrop();
    final.contain({ w: size, h: size });
    
    final.color([{ apply: 'saturate', params: [30] }]);
    
    const targetName = `./public/synapsi_brain_v6.png`;
    await final.write(targetName);

    console.log(`VICTORY: SOLID SILHOUETTE GENERATED AT ${targetName}`);
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
