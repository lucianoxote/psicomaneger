const Jimp = require('jimp');

async function processImage() {
  try {
    // --- PART 1: Full Logo with Slogans (For Login Page) ---
    const sourceFull = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776778552639.png';
    const bgFull = await Jimp.read(sourceFull);
    bgFull.scan(0, 0, bgFull.bitmap.width, bgFull.bitmap.height, function(x, y, idx) {
      if (this.bitmap.data[idx + 0] > 248 && this.bitmap.data[idx + 1] > 248 && this.bitmap.data[idx + 2] > 248) {
        this.bitmap.data[idx + 3] = 0; 
      } else {
        this.bitmap.data[idx + 3] = 255;
      }
    });
    bgFull.autocrop().color([{ apply: 'saturate', params: [40] }, { apply: 'brighten', params: [5] }]);
    await bgFull.writeAsync('./public/images/logo-sinapsi-full.png');

    // --- PART 2: Clean Logo (For Sidebar/Watermark) ---
    const sourceClean = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776779368168.png';
    const bgClean = await Jimp.read(sourceClean);
    bgClean.scan(0, 0, bgClean.bitmap.width, bgClean.bitmap.height, function(x, y, idx) {
      if (this.bitmap.data[idx + 0] > 248 && this.bitmap.data[idx + 1] > 248 && this.bitmap.data[idx + 2] > 248) {
        this.bitmap.data[idx + 3] = 0; 
      } else {
        this.bitmap.data[idx + 3] = 255;
      }
    });
    bgClean.autocrop().color([{ apply: 'saturate', params: [40] }, { apply: 'brighten', params: [5] }]);
    await bgClean.writeAsync('./public/images/logo-sinapsi.png');

    // Create Dark Mode Version (White Text) from Clean Logo
    const whiteLogo = bgClean.clone();
    const midPoint = Math.floor(whiteLogo.bitmap.height * 0.45); // Focus on the text area
    
    whiteLogo.scan(0, 0, whiteLogo.bitmap.width, whiteLogo.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];
      const yPos = Math.floor(idx / 4 / whiteLogo.bitmap.width);

      // If we are in the text area (bottom half), make everything that isn't transparent white
      if (a > 50 && yPos > midPoint) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
        this.bitmap.data[idx + 3] = 255; 
      }
      
      // Also catch any stray dark bits in the brain area and brighten them
      if (a > 50 && yPos <= midPoint && r < 100 && g < 100 && b < 100) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
    });

    // Special brightness boost for Dark Mode nodes
    whiteLogo.color([{ apply: 'brighten', params: [10] }]);
    
    await whiteLogo.writeAsync('./public/images/logo-sinapsi-white.png');

    // --- PART 3: High-Res Brain Icon (Favicon) ---
    const iconSourcePath = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776779650689.png';
    const brainIcon = await Jimp.read(iconSourcePath);
    brainIcon.scan(0, 0, brainIcon.bitmap.width, brainIcon.bitmap.height, function(x, y, idx) {
      if (this.bitmap.data[idx + 0] > 248 && this.bitmap.data[idx + 1] > 248 && this.bitmap.data[idx + 2] > 248) {
        this.bitmap.data[idx + 3] = 0; 
      } else {
        this.bitmap.data[idx + 3] = 255;
      }
    });
    brainIcon.autocrop().color([{ apply: 'saturate', params: [45] }, { apply: 'brighten', params: [5] }]);
    await brainIcon.writeAsync('./public/favicon-sinapsi.png');

    console.log('ALL ASSETS GENERATED SUCCESS');

    console.log('TRANSPARENCY SUCCESS');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processImage();
