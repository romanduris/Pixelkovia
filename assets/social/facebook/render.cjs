// Authoring only: compose the approved PNG without changing its pixels.
// Run from any directory: node assets/social/facebook/render.cjs
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || '../../../admin/node_modules/sharp');

const output = __dirname;
const root = path.resolve(output, '../../..');
const svg = markup => Buffer.from(markup);

async function circle(input, diameter) {
  const mask = await sharp(svg(`<svg width="${diameter * 4}" height="${diameter * 4}" xmlns="http://www.w3.org/2000/svg"><circle cx="${diameter * 2}" cy="${diameter * 2}" r="${diameter * 2}" fill="white"/></svg>`))
    .resize(diameter, diameter).png().toBuffer();
  return sharp(input).resize(diameter, diameter).ensureAlpha()
    .composite([{input: mask, blend: 'dest-in'}]).png().toBuffer();
}

async function main() {
  const spec = JSON.parse(await fs.readFile(path.join(output, 'artwork.json'), 'utf8'));
  const source = await fs.readFile(path.join(root, spec.character.source));
  if (createHash('sha256').update(source).digest('hex') !== spec.character.sha256) {
    throw new Error('Approved Piko source changed. Review the character before rendering.');
  }
  const character = await sharp(source).extract(spec.character.crop).png().toBuffer();
  const columns = [256, 544, 832];
  const profiles = [];
  for (const [variant, background] of Object.entries(spec.backgrounds)) {
    const input = await sharp(path.join(output, background))
      .composite([{input: character, left: 0, top: 0}])
      .withIccProfile('srgb').png({compressionLevel: 9, adaptiveFiltering: true}).toBuffer();
    await fs.writeFile(path.join(output, `profile-${variant}.png`), input);
    profiles.push(input);
  }

  // Circles at 48 and 96 px are native size, never magnified for the sheet.
  const sheet = svg(`<svg width="1024" height="704" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="704" fill="#f6f0e5"/>
    <g font-family="DejaVu Sans, sans-serif" fill="#0d1424">
      <text x="48" y="46" font-size="24" font-weight="600">Návrhy profilovej fotografie</text>
      <text x="48" y="74" font-size="13" fill="#586274">Pôvodný Piko · rovnaký výrez vo všetkých variantoch</text>
      <g font-size="16" font-weight="600" text-anchor="middle">
        <text x="256" y="117">A · Brand</text>
        <text x="544" y="117">B · Svetlá</text>
        <text x="832" y="117">C · Dobrodružná</text>
      </g>
      <g font-size="13" fill="#586274">
        <text x="48" y="265">256 px</text>
        <text x="48" y="493">96 px</text>
        <text x="48" y="618">48 px</text>
        <text x="48" y="678" font-size="12">Kruhové náhľady 48 a 96 px sú vložené v skutočnej veľkosti (1 : 1).</text>
      </g>
    </g>
    <path d="M48 411H976 M48 557H976" stroke="#d9d9d3" stroke-width="1"/>
  </svg>`);
  const overlays = [];
  for (const [diameter, top] of [[256, 140], [96, 440], [48, 588]]) {
    for (const [index, profile] of profiles.entries()) {
      overlays.push({input: await circle(profile, diameter), left: columns[index] - diameter / 2, top});
    }
  }
  await sharp(sheet).composite(overlays).withIccProfile('srgb')
    .png({compressionLevel: 9, adaptiveFiltering: true})
    .toFile(path.join(output, spec.preview.file));
  console.log('Saved three 1024 × 1024 PNG proposals and comparison.png (256, 96, 48 px circles).');
}

main().catch(error => {console.error(error); process.exitCode = 1;});
