const { Jimp } = require('jimp');

async function processFavicon() {
  try {
    const source = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776802695708.png';
    let img = await Jimp.read(source);
    
    console.log('GENESIS: CREATING SOLID BRANDED ICON...');

    // 1. CLEAN BACKGROUND & SCAN TO FIND BOUNDS
    // We remove any semi-transparency and identify what is "brain"
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const r = img.bitmap.data[idx + 0];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;
      
      if (avg > 240) {
        img.bitmap.data[idx + 3] = 0; // Transparent
      } else {
        img.bitmap.data[idx + 3] = 255; // Mark as part of brain
      }
    });

    img.autocrop();
    const midPoint = img.bitmap.width / 2;

    // 2. SOLID FILL: Left is Teal, Right is Purple
    // We expand all marked pixels to fill the interior
    let solid = img.clone();
    
    // Iterative expansion to fill interior gaps (The "Solidify" magic)
    for (let i = 0; i < 30; i++) {
        let temp = solid.clone();
        solid.scan(0, 0, solid.bitmap.width, solid.bitmap.height, (x, y, idx) => {
            if (solid.bitmap.data[idx + 3] === 0) {
                // Check neighbors
                const neighbors = [
                    {x: x-1, y: y}, {x: x+1, y: y}, {x: x, y: y-1}, {x: x, y: y+1}
                ];
                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < solid.bitmap.width && n.y >= 0 && n.y < solid.bitmap.height) {
                        const nidx = (solid.bitmap.width * n.y + n.x) * 4;
                        if (solid.bitmap.data[nidx + 3] === 255) {
                            temp.bitmap.data[idx + 3] = 255;
                            // Color it based on location
                            if (x < midPoint) {
                                temp.bitmap.data[idx + 0] = 0;   // Teal R
                                temp.bitmap.data[idx + 1] = 162; // Teal G
                                temp.bitmap.data[idx + 2] = 165; // Teal B
                            } else {
                                temp.bitmap.data[idx + 0] = 138; // Purple R
                                temp.bitmap.data[idx + 1] = 58;  // Purple G
                                temp.bitmap.data[idx + 2] = 185; // Purple B
                            }
                            break;
                        }
                    }
                }
            }
        });
        solid = temp;
    }

    // Force original colors on the outline if needed, but solid looks better
    // 3. FINAL RESIZE: 100% COVERAGE (Force Square)
    const size = 128; // High res for browser scaling
    solid.resize({ w: size, h: size }); // Force 1:1 to fill tab
    
    solid.color([{ apply: 'saturate', params: [20] }]);
    
    await solid.write('./public/favicon-sinapsi.png');

    console.log('SOLID HD FAVICON GENERATED AT ./public/favicon-sinapsi.png');
    console.log('VERSION: v5 (SOLID BRAND)');
  } catch (err) {
    console.error('Error processing favicon:', err);
  }
}

processFavicon();
