const Jimp = require('jimp');

async function processImage() {
  try {
    // --- PART 1: Full Logo with Slogans (For Login Page) ---
    const sourceFull = 'C:/Users/Luciano Peixoto/.gemini/antigravity/brain/d8b49a20-ae89-45be-a3c4-41991d9aca60/media__1776794249922.png';
    let bgFull = await Jimp.read(sourceFull);
    
    // Smooth cleaning using Alpha Mapping (preserves anti-aliased edges)
    bgFull.scan(0, 0, bgFull.bitmap.width, bgFull.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const brightness = (r + g + b) / 3;

      if (brightness > 240) {
        // Map brightness to transparency (white = 0, light grey = semi-transparent)
        const alpha = Math.min(255, Math.floor((255 - brightness) * (255 / (255 - 240))));
        this.bitmap.data[idx + 3] = alpha;
      } else {
        this.bitmap.data[idx + 3] = 255;
      }
    });

    bgFull.autocrop();
    // Use high-quality resizing for internal components (let browser handle final scale)
    bgFull.resize(800, Jimp.AUTO); 
    bgFull.color([{ apply: 'saturate', params: [30] }]);
    await bgFull.writeAsync('./public/images/logo-sinapsi-full.png');

    // --- PART 2: Clean Logo (For Sidebar/Watermark) ---
    const bgClean = bgFull.clone();
    const h = bgClean.bitmap.height;
    bgClean.crop(0, 0, bgClean.bitmap.width, Math.floor(h * 0.65));
    bgClean.autocrop();

    await bgClean.writeAsync('./public/images/logo-sinapsi.png');

    // Create Premium Dark Mode Version (White Text + Original Brain)
    // We use the EXACT alpha channel from the source to avoid jagged edges
    const whiteLogo = bgClean.clone();
    const midPoint = Math.floor(whiteLogo.bitmap.height * 0.45);
    
    whiteLogo.scan(0, 0, whiteLogo.bitmap.width, whiteLogo.bitmap.height, function(x, y, idx) {
      const a = this.bitmap.data[idx + 3];
      const yPos = Math.floor(idx / 4 / whiteLogo.bitmap.width);

      if (a > 0) {
        if (yPos > midPoint) {
          // It's text: make it pure white but keep the original anti-aliased ALPHA
          this.bitmap.data[idx + 0] = 255;
          this.bitmap.data[idx + 1] = 255;
          this.bitmap.data[idx + 2] = 255;
        } else {
          // It's the brain: keep original colors/alpha, maybe just a touch more contrast
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
