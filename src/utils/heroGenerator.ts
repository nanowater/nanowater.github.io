import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// One Dark Theme Color Palette for Gradient Spots
const ONE_DARK_COLORS = [
  '#61afef', // Blue
  '#c678dd', // Purple
  '#56b6c2', // Cyan
  '#98c379', // Green
  '#d19a66', // Orange
  '#e06c75'  // Red
];

// Matches the main background of the blog (#21252b)
const ONE_DARK_BG = '#21252b';

/**
 * Generates a 2:1 smooth, modern Aurora Gradient PNG image with a fine grainy texture.
 * It renders blurred color spots + SVG turbulence noise, and converts it to a PNG via Sharp.
 */
export async function getOrGenerateHeroImage(title: string): Promise<string> {
  // 1. Generate MD5 hash of the title
  const hash = crypto.createHash('md5').update(title).digest('hex');
  const filename = `hero-gradient-${hash}.png`;
  
  const outputDir = path.join(process.cwd(), 'public', 'generated-heroes');
  const outputPath = path.join(outputDir, filename);
  const publicPath = `/generated-heroes/${filename}`;

  // If the image already exists, skip generation
  if (fs.existsSync(outputPath)) {
    return publicPath;
  }

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const hashBytes = Buffer.from(hash, 'hex');

  // 2. Derive deterministic parameters for circles from hash bytes
  // Choose 3 distinct colors from One Dark palette
  const color1 = ONE_DARK_COLORS[hashBytes[0] % ONE_DARK_COLORS.length];
  const color2 = ONE_DARK_COLORS[hashBytes[1] % ONE_DARK_COLORS.length];
  const color3 = ONE_DARK_COLORS[hashBytes[2] % ONE_DARK_COLORS.length];

  // Circle positions (mapped to various parts of 1020x510 canvas)
  const cx1 = 150 + (hashBytes[3] % 250); // 150 ~ 400
  const cy1 = 100 + (hashBytes[4] % 150); // 100 ~ 250
  const r1  = 200 + (hashBytes[5] % 150); // 200 ~ 350
  const op1 = 0.35 + (hashBytes[6] % 25) / 100; // 0.35 ~ 0.60

  const cx2 = 600 + (hashBytes[7] % 250); // 600 ~ 850
  const cy2 = 200 + (hashBytes[8] % 180); // 200 ~ 380
  const r2  = 250 + (hashBytes[9] % 150); // 250 ~ 400
  const op2 = 0.30 + (hashBytes[10] % 25) / 100; // 0.30 ~ 0.55

  const cx3 = 350 + (hashBytes[11] % 300); // 350 ~ 650
  const cy3 = 150 + (hashBytes[12] % 200); // 150 ~ 350
  const r3  = 180 + (hashBytes[13] % 120); // 180 ~ 300
  const op3 = 0.25 + (hashBytes[14] % 25) / 100; // 0.25 ~ 0.50

  // Standard deviation for blur filter (high blur creates smooth aurora look)
  const blurDev = 90 + (hashBytes[15] % 30); // 90 ~ 120

  // 3. Construct Blurry Aurora SVG with Grainy Noise Filter
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1020 510" width="1020" height="510">
      <defs>
        <!-- Gradients blur filter -->
        <filter id="aurora-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${blurDev}" />
        </filter>
        
        <!-- Grain/Noise Texture Filter -->
        <filter id="grainy-noise" x="0%" y="0%" width="100%" height="100%">
          <!-- High frequency (0.90) and octaves (4) for a fine, sand-like analog grain -->
          <feTurbulence type="fractalNoise" baseFrequency="0.90" numOctaves="4" result="noise" />
          <!-- Raised opacity to 14% (0.14) to make the fuzzy/static TV-like texture visibly rough -->
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.14 0" result="softNoise" />
          <feComposite operator="in" in2="SourceGraphic" result="monoNoise" />
          <feBlend mode="overlay" in="SourceGraphic" in2="monoNoise" />
        </filter>
      </defs>
      
      <!-- Apply the grainy noise overlay globally on this group -->
      <g filter="url(#grainy-noise)">
        <!-- Base theme dark background -->
        <rect width="1020" height="510" fill="${ONE_DARK_BG}" />
        
        <!-- Blended colorful spots -->
        <circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="${color1}" opacity="${op1}" filter="url(#aurora-blur)" />
        <circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="${color2}" opacity="${op2}" filter="url(#aurora-blur)" />
        <circle cx="${cx3}" cy="${cy3}" r="${r3}" fill="${color3}" opacity="${op3}" filter="url(#aurora-blur)" />
      </g>
    </svg>
  `.trim();

  // 4. Render SVG into a high-quality PNG using Sharp
  await sharp(Buffer.from(svgString))
    .png()
    .toFile(outputPath);

  return publicPath;
}
