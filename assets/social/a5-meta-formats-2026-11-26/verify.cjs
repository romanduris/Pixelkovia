/* Delivery QA for the four A5 Meta exports. Run: node <this-file> */
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const out = __dirname;
const root = path.resolve(out, '../../..');
const sharp = require(path.join(root, 'admin/node_modules/sharp'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = new Map([
  ['4x5', [1080, 1350]], ['1x1', [1080, 1080]],
  ['9x16', [1080, 1920]], ['191x1', [1200, 628]]
]);
const originalPaths = {
  paper: 'assets/sales/public-previews/decoder.webp',
  screen: 'assets/sales/game-lock-partial.webp'
};

function assert(condition, message) {
  if (!condition) throw Error(message);
}

function finite(values) {
  return values.every(value => typeof value === 'number' && Number.isFinite(value));
}

function deliveredPath(file, kind) {
  assert(typeof file === 'string' && file.length > 0 && !path.isAbsolute(file), `${kind}: expected a relative delivery path`);
  const absolute = path.resolve(out, file);
  assert(absolute.startsWith(out + path.sep), `${kind}: path escapes the delivery folder`);
  return absolute;
}

function validateBounds(bounds, width, height, label) {
  assert(Array.isArray(bounds) && bounds.length === 4 && finite(bounds), `${label}: expected finite [x, y, width, height]`);
  const [x, y, w, h] = bounds;
  assert(w > 0 && h > 0, `${label}: width and height must be positive`);
  assert(x >= 0 && y >= 0 && x + w <= width && y + h <= height, `${label}: critical object extends outside ${width}×${height}`);
}

function validateSelfContained(svg, id) {
  assert(/<svg\b/.test(svg), `${id}: editable file is not an SVG`);
  assert(!/<script\b|<foreignObject\b|\son[a-z]+\s*=/i.test(svg), `${id}: SVG contains active content`);
  assert(!/<(?:!DOCTYPE|!ENTITY)\b/i.test(svg), `${id}: SVG contains an external XML declaration`);
  for (const match of svg.matchAll(/(?:\bxlink:)?\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const reference = match[2].trim();
    assert(reference.startsWith('#') || /^data:(?:image\/(?:png|jpeg|webp)|font\/[\w.+-]+);base64,/i.test(reference), `${id}: external or unsupported SVG href`);
  }
  for (const match of svg.matchAll(/url\(\s*([^)]*)\)/gi)) {
    const reference = match[1].trim().replace(/^(["'])(.*)\1$/, '$2');
    assert(reference.startsWith('#') || /^data:(?:image\/(?:png|jpeg|webp)|font\/[\w.+-]+);base64,/i.test(reference), `${id}: external CSS resource in SVG`);
  }
  assert(!/@import\b/i.test(svg), `${id}: external CSS import in SVG`);
  assert(/mix-blend-mode\s*:\s*multiply\b/.test(svg), `${id}: paper illumination blend is missing`);
  assert(/mix-blend-mode\s*:\s*screen\b/.test(svg), `${id}: phone reflection blend is missing`);
  assert(/id\s*=\s*["']paper-surface["']/.test(svg), `${id}: photographed stationery occlusion mask is missing`);
  assert(/id\s*=\s*["']physical-phone-glass["']/.test(svg), `${id}: physical phone glass clip is missing`);
  assert(!/(?:transform|points|d)\s*=\s*["'][^"'<]*(?:NaN|Infinity)/.test(svg), `${id}: non-finite SVG geometry`);
}

function embeddedPng(svg, imageId, id) {
  const tags = [...svg.matchAll(/<image\b[^>]*>/g)].map(match => match[0]).filter(tag => {
    const attribute = tag.match(/\bid\s*=\s*(["'])(.*?)\1/);
    return attribute?.[2] === imageId;
  });
  assert(tags.length === 1, `${id}: expected exactly one embedded image #${imageId}`);
  const href = tags[0].match(/(?:\bxlink:)?\bhref\s*=\s*(["'])(.*?)\1/);
  assert(href && href[2].startsWith('data:image/png;base64,'), `${id}: #${imageId} must embed the approved PNG pixels`);
  const encoded = href[2].slice('data:image/png;base64,'.length);
  assert(/^[A-Za-z0-9+/]+={0,2}$/.test(encoded), `${id}: invalid PNG data for #${imageId}`);
  return Buffer.from(encoded, 'base64');
}

async function pixels(bytes) {
  return sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function verify() {
  const manifest = JSON.parse(await fs.readFile(path.join(out, 'artwork.json'), 'utf8'));
  assert(Array.isArray(manifest.exports) && manifest.exports.length === 4, 'artwork.json must contain exactly four exports');
  assert(new Set(manifest.exports.map(item => item.id)).size === 4 && manifest.exports.every(item => expected.has(item.id)), 'Export IDs must be exactly 4x5, 1x1, 9x16 and 191x1');
  const originals = {};
  for (const [kind, relative] of Object.entries(originalPaths)) {
    const bytes = await fs.readFile(path.join(root, relative));
    originals[kind] = { sha256: hash(bytes), raw: await pixels(bytes) };
  }

  for (const item of manifest.exports) {
    const id = item.id;
    const [width, height] = expected.get(id);
    assert(Array.isArray(item.dimensions) && item.dimensions.length === 2 && item.dimensions[0] === width && item.dimensions[1] === height, `${id}: manifest dimensions must be ${width}×${height}`);
    assert(item.file === `koncept_05_${id}.png`, `${id}: filename must be koncept_05_${id}.png`);
    const png = await fs.readFile(deliveredPath(item.file, id + ' PNG'));
    const meta = await sharp(png).metadata();
    assert(meta.format === 'png' && meta.width === width && meta.height === height && meta.space === 'srgb' && !meta.hasAlpha, `${id}: PNG must be opaque sRGB ${width}×${height}`);
    assert(typeof item.sha256 === 'string' && /^[a-f0-9]{64}$/.test(item.sha256) && hash(png) === item.sha256, `${id}: PNG SHA-256 differs from artwork.json`);

    const safe = item.safeArea;
    assert(safe && finite([safe.left, safe.top, safe.right, safe.bottom]), `${id}: safeArea must contain finite absolute canvas edges`);
    assert(safe.left >= 0 && safe.top >= 0 && safe.right <= width && safe.bottom <= height && safe.left < safe.right && safe.top < safe.bottom, `${id}: invalid safe area rectangle`);
    assert(Array.isArray(item.textBounds) && item.textBounds.length > 0, `${id}: text bounds are missing`);
    for (const text of item.textBounds) {
      assert(text && typeof text.text === 'string' && text.text.trim().length > 0, `${id}: textBounds entry needs its text label`);
      validateBounds([text.x, text.y, text.width, text.height], width, height, `${id} text “${text.text}”`);
      assert(text.x >= safe.left && text.y >= safe.top && text.x + text.width <= safe.right && text.y + text.height <= safe.bottom, `${id}: text “${text.text}” crosses the safe area or reserved CTA zone`);
    }

    assert(item.productBounds && typeof item.productBounds === 'object', `${id}: product bounds are missing`);
    for (const kind of ['paper', 'screen']) {
      assert(item[kind]?.source === originalPaths[kind], `${id}: ${kind} uses an unapproved product source`);
      assert(item[kind].rotation === 180, `${id}: ${kind} must face the family at 180°`);
      assert(item[kind].sha256 === originals[kind].sha256, `${id}: ${kind} source SHA-256 differs from the original`);
      validateBounds(item.productBounds[kind], width, height, `${id} ${kind}`);
      const [, y, , h] = item.productBounds[kind];
      assert(y + h < safe.bottom, `${id}: ${kind} overlaps or touches the reserved CTA zone`);
    }

    assert(typeof item.editable === 'string' && /\.svg$/i.test(item.editable), `${id}: editable SVG path is missing`);
    const svg = await fs.readFile(deliveredPath(item.editable, id + ' SVG'), 'utf8');
    validateSelfContained(svg, id);
    for (const [kind, imageId] of [['paper', 'real-paper'], ['screen', 'real-screen']]) {
      const embedded = embeddedPng(svg, imageId, id);
      const embeddedMeta = await sharp(embedded).metadata();
      assert(embeddedMeta.format === 'png', `${id}: #${imageId} is not a PNG`);
      const raw = await pixels(embedded), original = originals[kind].raw;
      assert(raw.info.width === original.info.width && raw.info.height === original.info.height && raw.info.channels === original.info.channels && raw.data.equals(original.data), `${id}: #${imageId} pixels differ from the exact approved original`);
    }
    console.log(`PASS ${id}: ${width}×${height}, PNG/SVG, safe text and CTA, original family-facing game assets`);
  }
  console.log('PASS 4/4 A5 formats');
}

verify().catch(error => { console.error('FAIL: ' + error.message); process.exitCode = 1; });
