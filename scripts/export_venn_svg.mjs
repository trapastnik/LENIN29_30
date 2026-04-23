// Экспорт Венн-диаграммы как SVG для импорта в Figma.
// Canvas 1672×941 (совпадает с venn-bg.png). Текстовые слои с id-шками, чтобы
// редактор мог двигать. После правки координаты обновляются в _index.json.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/dvn/Desktop/WWWWW/BMK/29-30/mtk29';
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/content/parties/_index.json'), 'utf8'));
const outSvg = path.join(ROOT, 'public/content/parties/_figma-export.svg');
const outCoords = path.join(ROOT, 'public/content/parties/_figma-coords.json');

const W = 1672, H = 941;

const CAMP = Object.fromEntries(idx.camps.map(c => [c.id, c]));
const CAMP_HEX = {
  red:       '#CC2E2E',
  'rev-dem': '#B36BA8',
  white:     '#E3E1DA',
  green:     '#5AA06A',
  national:  '#E3B650',
};

const ICONS = {
  star:    '<path d="M12 2l2.9 6.9L22 10l-5.3 4.6L18.2 22 12 18.3 5.8 22l1.5-7.4L2 10l7.1-1.1L12 2z"/>',
  shield:  '<path d="M12 2L4 5v7c0 5.5 3.4 9.5 8 10 4.6-.5 8-4.5 8-10V5l-8-3z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  people:  '<g><circle cx="9" cy="8" r="3.2"/><circle cx="15" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M9.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" fill="none" stroke="currentColor" stroke-width="1.8"/></g>',
  anarchy: '<g fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M6.5 16.5l5.5-9.5 5.5 9.5M8.5 13h7" stroke-linecap="round"/></g>',
  flag:    '<path d="M5 3v18M5 4h10l2 3h5v8H10l-2-3H5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
};

function pxX(p) { return Math.round(p / 100 * W); }
function pxY(p) { return Math.round(p / 100 * H); }

const coords = { canvas: { w: W, h: H }, headers: [], chips: [] };

const headerGroups = idx.venn_headers.map(h => {
  const camp = CAMP[h.camp];
  const x = pxX(h.x), y = pxY(h.y);
  const color = CAMP_HEX[h.camp];
  const title = camp.title_ru.toUpperCase();
  coords.headers.push({ id: h.camp, x, y, title });
  return `
  <g id="header-${h.camp}" transform="translate(${x} ${y})">
    <g transform="translate(-26 -60)" fill="${color}">
      <circle cx="26" cy="26" r="24" fill="rgba(0,0,0,0.45)" stroke="${color}" stroke-width="1.5"/>
      <g transform="translate(14 14) scale(1.0)" color="${color}">${ICONS[camp.icon]}</g>
    </g>
    <text x="0" y="0" text-anchor="middle" fill="${color}" font-family="Playfair Display, Georgia, serif" font-size="22" font-weight="700" letter-spacing="3">${title}</text>
    <g transform="translate(0 24)">
      <rect x="-42" y="-16" width="84" height="28" rx="14" fill="none" stroke="${color}" stroke-width="1"/>
      <text x="0" y="4" text-anchor="middle" fill="${color}" font-family="PT Serif, Georgia, serif" font-size="14">Справка</text>
    </g>
  </g>`;
}).join('\n');

const chips = idx.items.filter(i => !i._is_general && i.x != null).map(it => {
  const x = pxX(it.x), y = pxY(it.y);
  const color = CAMP_HEX[it.camp];
  coords.chips.push({ id: it.id, camp: it.camp, x, y, title: it.title_ru });
  return `
  <g id="chip-${it.id}" transform="translate(${x} ${y})">
    <circle cx="0" cy="0" r="5" fill="${color}"/>
    <text x="14" y="5" fill="#f5f0e0" font-family="PT Serif, Georgia, serif" font-size="17">${it.title_ru.replace(/</g, '&lt;').replace(/&/g, '&amp;')}</text>
  </g>`;
}).join('\n');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Venn background (image layer) -->
  <image id="venn-bg" xlink:href="venn-bg.png" x="0" y="0" width="${W}" height="${H}"/>

  <!-- Annotation: подпись-описание сверху -->
  <g id="ornament">
    <text x="${W/2}" y="40" text-anchor="middle" fill="#c8b68a"
          font-family="Playfair Display, Georgia, serif" font-style="italic"
          font-size="18">
      Пересекающиеся области показывают возможные идеологические связи
    </text>
    <text x="${W/2}" y="62" text-anchor="middle" fill="#c8b68a"
          font-family="Playfair Display, Georgia, serif" font-style="italic"
          font-size="18">
      и участие партий в нескольких направлениях политической жизни.
    </text>
  </g>

  <!-- Group headers (icon + title + "Справка" button) -->
  <g id="headers">${headerGroups}
  </g>

  <!-- Party chips -->
  <g id="chips">${chips}
  </g>

  <!-- Footer -->
  <g id="footer" transform="translate(0 ${H - 30})">
    <text x="30" y="12" fill="rgba(245,240,224,0.55)" font-family="JetBrains Mono, monospace" font-size="13">
      <tspan fill="#f5f0e0" font-weight="700">Всего справок: 20</tspan>  ·  Максимум 3000 знаков текста, до 5 изображений
    </text>
    <g transform="translate(${W - 150} 0)">
      <rect x="-4" y="-6" width="148" height="28" rx="14" fill="none" stroke="#c49a2e"/>
      <text x="70" y="12" text-anchor="middle" fill="#c49a2e" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2">ВСЕ СПРАВКИ →</text>
    </g>
  </g>
</svg>
`;

fs.writeFileSync(outSvg, svg, 'utf8');
fs.writeFileSync(outCoords, JSON.stringify(coords, null, 2), 'utf8');
console.log('wrote', outSvg);
console.log('wrote', outCoords);
console.log(`canvas: ${W}×${H}, headers: ${coords.headers.length}, chips: ${coords.chips.length}`);
