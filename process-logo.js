const Jimp = require('jimp');

async function processImage() {
  try {
    // --- PART 1: Full Logo with Slogans (For Login Page) ---
    const sourceFull = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776792887743.png';
    const bgFull = await Jimp.read(sourceFull);
    bgFull.scan(0, 0, bgFull.bitmap.width, bgFull.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Aggressive cleaning for high-res source artifacts
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; 
      } else {
        this.bitmap.data[idx + 3] = 255;
      }
    });

    bgFull.autocrop();
    bgFull.color([{ apply: 'saturate', params: [40] }, { apply: 'brighten', params: [5] }]);
    await bgFull.writeAsync('./public/images/logo-sinapsi-full.png');

    // --- PART 2: Clean Logo (For Sidebar/Watermark) ---
    // Extract Brain + "SinapsiGestor" text area
    const bgClean = bgFull.clone();
    const h = bgClean.bitmap.height;
    // The "SinapsiGestor" part is in the top 65% of the cropped area
    bgClean.crop(0, 0, bgClean.bitmap.width, Math.floor(h * 0.65));
    bgClean.autocrop();

    await bgClean.writeAsync('./public/images/logo-sinapsi.png');

    // Create Dark Mode Version (White Text) from Clean Logo
    const whiteLogo = bgClean.clone();
    const midPoint = Math.floor(whiteLogo.bitmap.height * 0.45);
    
    whiteLogo.scan(0, 0, whiteLogo.bitmap.width, whiteLogo.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];
      const yPos = Math.floor(idx / 4 / whiteLogo.bitmap.width);

      // Bottom part (text) goes white
      if (a > 50 && yPos > midPoint) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
      
      // Top part (brain) dark shades go white for contrast
      if (a > 50 && yPos <= midPoint && r < 120 && g < 120 && b < 120) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
    });
    whiteLogo.color([{ apply: 'brighten', params: [10] }]);
    await whiteLogo.writeAsync('./public/images/logo-sinapsi-white.png');

    // --- PART 3: High-Res Brain Icon (Favicon) ---
    const brainIcon = bgClean.clone();
    brainIcon.crop(0, 0, brainIcon.bitmap.width, Math.floor(brainIcon.bitmap.height * 0.45));
    brainIcon.autocrop();
    brainIcon.color([{ apply: 'saturate', params: [45] }, { apply: 'brighten', params: [5] }]);
    await brainIcon.writeAsync('./public/favicon-sinapsi.png');

    console.log('ALL SinapsiGestor ASSETS GENERATED SUCCESS');
    console.log('TRANSPARENCY SUCCESS');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processImage();
