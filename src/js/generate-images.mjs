import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = {
  mobile: 320,
  tablet: 480,
  desktop: 640
};

const buttons = [
  'HOW_IT_WORKS',
  'INTERACTIVE_MAP',
  'DOWNLOAD'
];

async function generateResponsiveImages() {
  for (const button of buttons) {
    const inputPath = path.join(__dirname, '../../public/assets/buttons', `${button}.png`);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${button} - file not found`);
      continue;
    }

    console.log(`Processing ${button}...`);

    for (const [device, width] of Object.entries(sizes)) {
      const outputPathWebp = path.join(__dirname, '../../public/assets/buttons', `${button.toLowerCase()}-${width}.webp`);
      const outputPathPng = path.join(__dirname, '../../public/assets/buttons', `${button.toLowerCase()}-${width}.png`);

      try {
        // Get original image dimensions to calculate height
        const metadata = await sharp(inputPath).metadata();
        const aspectRatio = metadata.height / metadata.width;
        const height = Math.round(width * aspectRatio);

        // Generate WebP
        await sharp(inputPath)
          .resize(width, height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .webp({ quality: 85 })
          .toFile(outputPathWebp);

        // Generate PNG fallback
        await sharp(inputPath)
          .resize(width, height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPathPng);

        console.log(`  Generated ${device} variants (${width}x${height})`);
      } catch (error) {
        console.error(`  Error processing ${button} for ${device}:`, error.message);
      }
    }
  }

  console.log('Image generation complete!');
}

generateResponsiveImages().catch(console.error);