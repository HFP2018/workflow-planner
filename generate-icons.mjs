/**
 * 使用纯 SVG 生成图标文件（保存为 SVG 格式作为占位符）
 * 实际 PNG 生成需要在有 canvas 支持的环境中运行
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync('public/icons', { recursive: true });

function createSVGIcon(size) {
  const fontSize = Math.floor(size * 0.45);
  const radius = size * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#grad)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="serif" font-size="${fontSize}" fill="white" font-weight="bold">规</text>
</svg>`;
}

for (const size of sizes) {
  const svgContent = createSVGIcon(size);
  const filePath = join('public/icons', `icon-${size}x${size}.svg`);
  writeFileSync(filePath, svgContent, 'utf8');
  console.log(`Created: ${filePath}`);
}

// 创建一个 apple-touch-icon.svg
writeFileSync('public/apple-touch-icon.svg', createSVGIcon(180), 'utf8');
console.log('Created: public/apple-touch-icon.svg');

console.log('\nNote: SVG icons created. For production PNG icons, use an online converter or ImageMagick.');
