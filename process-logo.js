const Jimp = require('jimp');

async function processImage() {
  try {
    // --- PART 1: Full Logo with Slogans (For Login Page) ---
    const sourceFull = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776794249922.png';
    let bgFull = await Jimp.read(sourceFull);
    
    // DEEP CLEAN: Aggressive background extraction + Noise filtering
    bgFull.scan(0, 0, bgFull.bitmap.width, bgFull.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const avg = (r + g + b) / 3;

      // Aggressive cut for anything near white to kill artifacts/dots
      if (avg > 235) {
        this.bitmap.data[idx + 3] = 0; 
      } else {
        // Boost contrast of non-transparent areas
        this.bitmap.data[idx + 3] = 255;
      }
    });

    bgFull.autocrop();
    bgFull.resize(1000, Jimp.AUTO); // Large size for browser-side high-quality downscaling
    bgFull.color([{ apply: 'saturate', params: [35] }]);
    await bgFull.writeAsync('./public/images/logo-sinapsi-full.png');

    // --- PART 2: Clean Logo (For Sidebar/Watermark) ---
    const bgClean = bgFull.clone();
    const h = bgClean.bitmap.height;
    bgClean.crop(0, 0, bgClean.bitmap.width, Math.floor(h * 0.65));
    bgClean.autocrop();
    await bgClean.writeAsync('./public/images/logo-sinapsi.png');

    // Create Premium Dark Mode Version (White Text + Clean Brain)
    const whiteLogo = bgClean.clone();
    const midPoint = Math.floor(whiteLogo.bitmap.height * 0.45);
    
    whiteLogo.scan(0, 0, whiteLogo.bitmap.width, whiteLogo.bitmap.height, function(x, y, idx) {
      const a = this.bitmap.data[idx + 3];
      const yPos = Math.floor(idx / 4 / whiteLogo.bitmap.width);

      if (a > 0) {
        if (yPos > midPoint) {
          // Force pure solid white for text to stop any "fuzziness"
          this.bitmap.data[idx + 0] = 255;
          this.bitmap.data[idx + 1] = 255;
          this.bitmap.data[idx + 2] = 255;
          this.bitmap.data[idx + 3] = 255;
        } else {
          // Brand Colors: Brighten slightly for dark theme visibility
          this.bitmap.data[idx + 0] = Math.min(255, this.bitmap.data[idx + 0] + 10);
          this.bitmap.data[idx + 1] = Math.min(255, this.bitmap.data[idx + 1] + 10);
          this.bitmap.data[idx + 2] = Math.min(255, this.bitmap.data[idx + 2] + 10);
        }
      }
    });

    await whiteLogo.writeAsync('./public/images/logo-sinapsi-white.png');

    // --- PART 3: High-Res Brain Icon (Favicon) ---
    const brainIcon = bgClean.clone();
    brainIcon.crop(0, 0, brainIcon.bitmap.width, Math.floor(brainIcon.bitmap.height * 0.45));
    brainIcon.autocrop();
    brainIcon.color([{ apply: 'saturate', params: [45] }]);
    await brainIcon.writeAsync('./public/favicon-sinapsi.png');

    console.log('REMASTERED SinapsiGestor ASSETS GENERATED SUCCESS');
    console.log('TRANSPARENCY SUCCESS');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processImage();
