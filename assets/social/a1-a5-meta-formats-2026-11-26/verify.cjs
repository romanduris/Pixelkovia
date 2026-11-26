/* Delivery QA for all twenty A1–A5 Meta exports and the aggregate gallery. */
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const out = __dirname;
const root = path.resolve(out, '../../..');
const socialRoot = path.join(root, 'assets/social');
const sharp = require(path.join(root, 'admin/node_modules/sharp'));
const dimensions = new Map([
  ['4x5', [1080, 1350]], ['1x1', [1080, 1080]],
  ['9x16', [1080, 1920]], ['191x1', [1200, 628]]
]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = text => text.replace(/\s+/gu, ' ').trim();
const finite = values => values.every(value => Number.isFinite(value));
const within = (file, directory) => file.startsWith(directory + path.sep);

function decodeXml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entity[0] === '#') return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity.toLowerCase()];
  });
}

function localFile(folder, relative, label) {
  assert.equal(typeof relative, 'string', `${label}: missing relative path`);
  assert(relative.length > 0 && !path.isAbsolute(relative), `${label}: expected relative path`);
  const result = path.resolve(folder, relative);
  assert(within(result, folder), `${label}: path escapes its concept folder`);
  return result;
}

function rectangle(values, W, H, label) {
  assert(Array.isArray(values) && values.length === 4 && finite(values), `${label}: invalid bounds`);
  const [x, y, width, height] = values;
  assert(width > 0 && height > 0 && x >= 0 && y >= 0 && x + width <= W && y + height <= H, `${label}: object leaves the canvas`);
}

function insideSafe(values, safe, label) {
  const [x, y, width, height] = values;
  assert(x >= safe.left && y >= safe.top && x + width <= safe.right && y + height <= safe.bottom, `${label}: object crosses the safe area`);
}

function overlaps(a, b) {
  return a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
}

function projectedBounds(quad, geometry) {
  assert(Array.isArray(quad) && quad.length === 4 && quad.every(p => Array.isArray(p) && p.length === 2 && finite(p)), 'Invalid product quad');
  const x = quad.map(p => p[0] * geometry.scale + geometry.x);
  const y = quad.map(p => p[1] * geometry.scale + geometry.y);
  return [Math.min(...x), Math.min(...y), Math.max(...x) - Math.min(...x), Math.max(...y) - Math.min(...y)];
}

function validateSvg(svg, item, label) {
  assert(/<svg\b/.test(svg), `${label}: editable file is not SVG`);
  assert(!/<script\b|<foreignObject\b|\son[a-z]+\s*=/i.test(svg), `${label}: active SVG content`);
  assert(!/<(?:!DOCTYPE|!ENTITY)\b|@import\b/i.test(svg), `${label}: external SVG/CSS declaration`);
  const allowed = ref => ref.startsWith('#') || /^data:(?:image\/(?:png|jpeg|webp)|font\/[\w.+-]+);base64,/i.test(ref);
  for (const match of svg.matchAll(/(?:\bxlink:)?\bhref\s*=\s*(["'])(.*?)\1/gi)) assert(allowed(match[2]), `${label}: external SVG image/font`);
  for (const match of svg.matchAll(/url\(\s*([^)]*)\)/gi)) assert(allowed(match[1].trim().replace(/^(["'])(.*)\1$/, '$2')), `${label}: external CSS resource`);
  assert(/mix-blend-mode\s*:\s*multiply\b/.test(svg) && /mix-blend-mode\s*:\s*screen\b/.test(svg), `${label}: photographic paper light / screen reflections missing`);
  assert(/id\s*=\s*["']paper-surface["']/.test(svg) && /id\s*=\s*["']physical-phone-glass["']/.test(svg), `${label}: paper occlusion / phone glass missing`);
  const visible = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map(m => decodeXml(m[1].replace(/<[^>]*>/g, '')));
  assert.deepEqual(visible, item.textBounds.filter(t => t.role !== 'logo').map(t => t.text), `${label}: SVG copy differs from measured manifest text`);
}

function embeddedPng(svg, id, label) {
  const matches = [...svg.matchAll(/<image\b[^>]*>/g)].map(m => m[0]).filter(tag => new RegExp(`\\bid\\s*=\\s*(["'])${id}\\1`).test(tag));
  assert.equal(matches.length, 1, `${label}: expected one embedded #${id}`);
  const href = matches[0].match(/(?:\bxlink:)?\bhref\s*=\s*(["'])(.*?)\1/);
  assert(href && href[2].startsWith('data:image/png;base64,'), `${label}: #${id} must embed PNG pixels`);
  return Buffer.from(href[2].slice('data:image/png;base64,'.length), 'base64');
}

async function pixels(bytes) {
  return sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function checkGallery(index) {
  const html = await fs.readFile(path.join(out, 'OTVORIT-NAHLAD.html'), 'utf8');
  const figures = [...html.matchAll(/<figure\b[^>]*>/gi)];
  assert.equal(figures.length, 20, 'Aggregate gallery must contain twenty cards');
  const references = [];
  for (const match of html.matchAll(/\b(href|src|data-normal|data-review)\s*=\s*(["'])(.*?)\2/gi)) {
    const [, attribute, , encoded] = match;
    const reference = decodeXml(encoded);
    if (/^https?:/i.test(reference)) {
      assert.equal(reference, 'https://pixelkovia.rodulab.com/', 'Unexpected external gallery link');
      continue;
    }
    assert(!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference), 'Unsupported gallery URL');
    const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    assert(pathname.length > 0, 'Empty local gallery URL');
    const absolute = path.resolve(out, pathname);
    assert(within(absolute, socialRoot), 'Gallery link escapes social authoring assets');
    assert((await fs.stat(absolute)).isFile(), `Broken gallery link: ${reference}`);
    references.push({ attribute, reference });
  }
  for (const [attribute, key] of [['src', 'file'], ['data-normal', 'file'], ['data-review', 'safePreview']]) {
    assert.deepEqual(references.filter(r => r.attribute === attribute).map(r => r.reference).sort(), index.exports.map(e => e[key]).sort(), `Gallery ${attribute} coverage differs from the twenty exports`);
  }
  const hrefs = new Set(references.filter(r => r.attribute === 'href').map(r => r.reference));
  for (const e of index.exports) for (const key of ['file', 'editable', 'prompts', 'gallery']) assert(hrefs.has(e[key]), `${e.concept} ${e.id}: missing gallery ${key} link`);
  console.log(`PASS gallery: 20 cards, ${references.length} valid local links and image references`);
}

async function main() {
  const index = JSON.parse(await fs.readFile(path.join(out, 'artwork-index.json'), 'utf8'));
  const v4 = JSON.parse(await fs.readFile(path.join(socialRoot, 'concepts-2026-11-26-room-v4-A/layout.json'), 'utf8'));
  assert.equal(index.totalExports, 20, 'Index totalExports must be twenty');
  assert.equal(index.newExports, 16, 'Index must identify sixteen new A2–A5 exports');
  assert.deepEqual(index.newConcepts, ['A2', 'A3', 'A4', 'A5']);
  assert.equal(index.publication, false);
  assert.equal(index.adActivation, false);
  assert.equal(index.destination, 'https://pixelkovia.rodulab.com/');
  assert(Array.isArray(index.concepts) && index.concepts.length === 5 && Array.isArray(index.exports) && index.exports.length === 20, 'Aggregate index needs five concepts and twenty exports');
  const originals = new Map();
  for (const source of ['assets/sales/public-previews/decoder.webp', 'assets/sales/public-previews/path.webp', 'assets/sales/game-lock-partial.webp']) {
    const bytes = await fs.readFile(path.join(root, source));
    originals.set(source, { sha256: hash(bytes), raw: await pixels(bytes) });
  }
  const expectedIndex = [];
  for (let n = 1; n <= 5; n++) {
    const concept = 'A' + n;
    const relativeFolder = `../a${n}-meta-formats-2026-11-26`;
    const folder = path.resolve(out, relativeFolder);
    const manifest = JSON.parse(await fs.readFile(path.join(folder, 'artwork.json'), 'utf8'));
    const layout = JSON.parse(await fs.readFile(path.join(folder, 'layouts.json'), 'utf8'));
    const original = v4.items.find(item => item.id === concept);
    assert(original, `${concept}: missing V4 source`);
    const copy = v4.angles[original.angle];
    assert.equal(manifest.source.file, `assets/social/concepts-2026-11-26-room-v4-A/${original.file}.png`, `${concept}: wrong approved source concept`);
    assert.equal(hash(await fs.readFile(path.join(root, manifest.source.file))), manifest.source.sha256, `${concept}: V4 source hash changed`);
    assert.equal(manifest.exports.length, 4, `${concept}: expected four exports`);
    assert.deepEqual(manifest.exports.map(e => e.id).sort(), [...dimensions.keys()].sort(), `${concept}: duplicate/missing format`);
    const indexedConcept = index.concepts.find(c => c.id === concept);
    assert.deepEqual(indexedConcept, { id: concept, folder: relativeFolder, source: manifest.source, mode: manifest.mode }, `${concept}: index source differs from manifest`);
    for (const item of manifest.exports) {
      const label = `${concept} ${item.id}`;
      const [W, H] = dimensions.get(item.id);
      const fileBase = `koncept_${String(n).padStart(2, '0')}_${item.id}`;
      assert.equal(item.file, fileBase + '.png', `${label}: wrong PNG filename`);
      assert.equal(item.editable, 'editable/' + fileBase + '.svg', `${label}: wrong SVG filename`);
      assert.deepEqual(item.dimensions, [W, H], `${label}: wrong manifest dimensions`);
      const png = await fs.readFile(localFile(folder, item.file, label));
      const pngMeta = await sharp(png).metadata();
      assert(pngMeta.format === 'png' && pngMeta.width === W && pngMeta.height === H && pngMeta.space === 'srgb' && !pngMeta.hasAlpha, `${label}: expected opaque sRGB PNG ${W}×${H}`);
      assert.equal(png.length, item.bytes, `${label}: byte count differs from manifest`);
      assert.equal(hash(png), item.sha256, `${label}: PNG hash differs from manifest`);
      const safe = item.safeArea;
      assert(safe && finite([safe.left, safe.top, safe.right, safe.bottom]), `${label}: invalid safe area`);
      // Delivery boundaries are whole pixels (e.g. landscape 628 × .78 = 489.84 → 490).
      assert(safe.left >= Math.round(W * .07) && safe.right <= Math.round(W * .93) && safe.top >= Math.round(H * (item.id === '9x16' ? .15 : .07)) && safe.bottom <= Math.round(H * .78), `${label}: reserved safe margins are too small`);
      assert(safe.left < safe.right && safe.top < safe.bottom, `${label}: inverted safe area`);
      assert(Array.isArray(item.textBounds) && item.textBounds.length > 0, `${label}: missing actual text bounds`);
      const roleText = role => normalize(item.textBounds.filter(t => t.role === role).map(t => t.text).join(' '));
      assert.equal(roleText('headline'), normalize(copy.headline.join(' ')), `${label}: headline differs from approved V4 copy`);
      assert.equal(roleText('support'), normalize(copy.support.join(' ')), `${label}: support differs from approved V4 copy`);
      assert.equal(roleText('fact'), '7 hádaniek 7–13 rokov 60–90 min', `${label}: facts changed`);
      assert.equal(roleText('brand'), 'Pixelkovia', `${label}: brand changed`);
      assert.equal(roleText('kicker'), 'RODINNÁ HRA NA DOMA', `${label}: kicker changed`);
      assert.equal(roleText('url'), 'pixelkovia.rodulab.com', `${label}: destination text changed`);
      for (const text of item.textBounds) {
        assert(typeof text.text === 'string' && text.text.length > 0, `${label}: unlabelled text bound`);
        const rect = [text.x, text.y, text.width, text.height];
        rectangle(rect, W, H, `${label} ${text.text}`);
        insideSafe(rect, safe, `${label} ${text.text}`);
      }
      const svg = await fs.readFile(localFile(folder, item.editable, label), 'utf8');
      validateSvg(svg, item, label);
      const geometry = item.photoGeometry;
      assert(geometry && finite([geometry.width, geometry.height, geometry.scale, geometry.x, geometry.y]) && geometry.scale > 0, `${label}: invalid optical framing`);
      assert(geometry.x <= 0 && geometry.y <= 0 && geometry.x + geometry.width * geometry.scale >= W - .01 && geometry.y + geometry.height * geometry.scale >= H - .01, `${label}: scene does not fill canvas`);
      const photo = await fs.readFile(path.join(folder, 'sources', fileBase + '.webp'));
      assert.equal(hash(photo), item.photograph, `${label}: photo source hash changed`);
      const photoMeta = await sharp(photo).metadata();
      assert(photoMeta.width === geometry.width && photoMeta.height === geometry.height, `${label}: photo geometry dimensions changed`);
      const physical = layout.items.find(i => i.id === item.id);
      assert(physical, `${label}: missing product layout`);
      for (const [kind, source, embeddedId] of [['paper', `assets/sales/public-previews/${original.paperSource}.webp`, 'real-paper'], ['screen', 'assets/sales/game-lock-partial.webp', 'real-screen']]) {
        const approved = originals.get(source);
        assert(approved && item[kind]?.source === source && item[kind].rotation === 180 && item[kind].sha256 === approved.sha256, `${label}: ${kind} must use its exact approved source, facing the family`);
        const rect = item.productBounds?.[kind];
        rectangle(rect, W, H, `${label} ${kind}`);
        insideSafe(rect, safe, `${label} ${kind}`);
        assert(rect[1] + rect[3] < safe.bottom, `${label}: ${kind} touches CTA zone`);
        projectedBounds(physical[kind + 'Quad'], geometry).forEach((value, i) => assert(Math.abs(value - rect[i]) < .011, `${label}: ${kind} bounds differ from physical projection`));
        for (const text of item.textBounds) assert(!overlaps([text.x, text.y, text.width, text.height], rect), `${label}: ${text.text} overlaps ${kind}`);
        const embedded = await pixels(embeddedPng(svg, embeddedId, label));
        assert(embedded.info.width === approved.raw.info.width && embedded.info.height === approved.raw.info.height && embedded.data.equals(approved.raw.data), `${label}: embedded ${kind} pixels differ from approved original`);
      }
      const safeMeta = await sharp(localFile(folder, item.safePreview, label)).metadata();
      assert(safeMeta.width === W && safeMeta.height === H, `${label}: invalid safe-area preview dimensions`);
      JSON.parse(await fs.readFile(path.join(folder, 'prompts.json'), 'utf8'));
      expectedIndex.push({ ...item, concept, file: relativeFolder + '/' + item.file, editable: relativeFolder + '/' + item.editable, safePreview: relativeFolder + '/' + item.safePreview, prompts: relativeFolder + '/prompts.json', gallery: relativeFolder + '/OTVORIT-NAHLAD.html' });
      console.log(`PASS ${label}: PNG/SVG, hashes, exact V4 copy, safe text/game, original family-facing product pixels`);
    }
  }
  const ordered = [...dimensions.keys()].flatMap(format => expectedIndex.filter(item => item.id === format));
  assert.deepEqual(index.exports, ordered, 'Aggregate index differs from its five current concept manifests');
  await checkGallery(index);
  console.log('PASS 20/20 A1–A5 Meta exports and aggregate gallery');
}

main().catch(error => { console.error('FAIL: ' + error.message); process.exitCode = 1; });
