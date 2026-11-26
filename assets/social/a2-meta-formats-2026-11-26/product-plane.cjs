/* Exact approved game assets on the photographed A2 paper and glass planes.
 * All geometry and output remain in raw photograph pixels. Callers own the
 * canvas, crop, type and optional native header-character cutout.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const defaultRoot = path.resolve(__dirname, '../../..');
const SCREEN_SOURCE = 'assets/sales/game-lock-partial.webp';
const PAPER_SOURCE = 'assets/sales/public-previews/path.webp';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const data = (bytes, mime) => `data:${mime};base64,${bytes.toString('base64')}`;

function solve(a, b) {
  a = a.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < b.length; i++) {
    let pivot = i;
    for (let j = i + 1; j < b.length; j++) if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const divisor = a[i][i];
    if (Math.abs(divisor) < 1e-10) throw Error('Degenerate product plane');
    for (let column = i; column <= b.length; column++) a[i][column] /= divisor;
    for (let row = 0; row < b.length; row++) if (row !== i) {
      const factor = a[row][i];
      for (let column = i; column <= b.length; column++) a[row][column] -= factor * a[i][column];
    }
  }
  return a.map(row => row[b.length]);
}

function validateQuad(q) {
  if (!Array.isArray(q) || q.length !== 4 || q.some(p => !Array.isArray(p) || p.length !== 2 || p.some(v => !Number.isFinite(v)))) {
    throw Error('A product plane needs four finite [x, y] photograph coordinates');
  }
  const area = Math.abs(q.reduce((sum, p, i) => sum + p[0] * q[(i + 1) % 4][1] - q[(i + 1) % 4][0] * p[1], 0)) / 2;
  if (area < 1) throw Error('Degenerate product plane');
}

function projection(q) {
  validateQuad(q);
  const a = [], b = [];
  [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, v], i) => {
    const [x, y] = q[i];
    a.push([u, v, 1, 0, 0, 0, -x * u, -x * v], [0, 0, 0, u, v, 1, -y * u, -y * v]);
    b.push(x, y);
  });
  const h = solve(a, b);
  return (u, v) => {
    const divisor = h[6] * u + h[7] * v + 1;
    const point = [(h[0] * u + h[1] * v + h[2]) / divisor, (h[3] * u + h[4] * v + h[5]) / divisor];
    if (point.some(value => !Number.isFinite(value))) throw Error('Non-finite product projection');
    return point;
  };
}

function orient(q, degrees = 0) {
  validateQuad(q);
  if (!Number.isFinite(degrees)) throw Error('Product rotation must be a number');
  const rotation = ((degrees % 360) + 360) % 360;
  if (rotation === 0) return q;
  if (rotation === 180) return [q[2], q[3], q[0], q[1]];
  throw Error('Only 0 or 180 degree product rotations are supported');
}

function roundedQuad(q, radius = 3) {
  validateQuad(q);
  const corners = q.map((corner, i) => {
    const previous = q[(i + 3) % 4], next = q[(i + 1) % 4];
    const before = Math.hypot(previous[0] - corner[0], previous[1] - corner[1]);
    const after = Math.hypot(next[0] - corner[0], next[1] - corner[1]);
    const distance = Math.min(radius, before / 4, after / 4);
    const toward = (point, length) => corner.map((value, axis) => value + (point[axis] - value) * distance / length);
    return { corner, start: toward(previous, before), end: toward(next, after) };
  });
  return corners.map(({ corner, start, end }, i) => `${i ? 'L' : 'M'}${start.join(' ')}Q${corner.join(' ')} ${end.join(' ')}`).join('') + 'Z';
}

function mesh(id, q, sourceWidth, sourceHeight, nx = 8, ny = 10) {
  const map = projection(q);
  let defs = '', body = '', number = 0;
  const triangle = (source, destination) => {
    const matrix = source.map(([x, y]) => [x, y, 1]);
    const [aa, cc, ee] = solve(matrix, destination.map(point => point[0]));
    const [bb, dd, ff] = solve(matrix, destination.map(point => point[1]));
    const clip = `${id}-t${number++}`;
    // Subpixel expansion prevents seams between triangles, without changing
    // the final paper/glass outline, which has its own physical-plane clip.
    const center = [destination.reduce((sum, point) => sum + point[0], 0) / 3, destination.reduce((sum, point) => sum + point[1], 0) / 3];
    const polygon = destination.map(point => {
      const dx = point[0] - center[0], dy = point[1] - center[1], length = Math.hypot(dx, dy);
      return [point[0] + dx / length * 0.25, point[1] + dy / length * 0.25].join(',');
    }).join(' ');
    defs += `<clipPath id="${clip}"><polygon points="${polygon}"/></clipPath>`;
    body += `<g clip-path="url(#${clip})"><use xlink:href="#${id}" transform="matrix(${aa} ${bb} ${cc} ${dd} ${ee} ${ff})"/></g>`;
  };
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const uv = [[x / nx, y / ny], [(x + 1) / nx, y / ny], [(x + 1) / nx, (y + 1) / ny], [x / nx, (y + 1) / ny]];
    for (const indices of [[0, 1, 2], [0, 2, 3]]) {
      triangle(indices.map(i => [uv[i][0] * sourceWidth, uv[i][1] * sourceHeight]), indices.map(i => map(...uv[i])));
    }
  }
  const clip = `${id}-plane`;
  defs += `<clipPath id="${clip}"><polygon points="${q.map(point => point.join(',')).join(' ')}"/></clipPath>`;
  return { defs, body: `<g clip-path="url(#${clip})">${body}</g>` };
}

async function paperSurface(photo, sharp) {
  // The mask accepts the original ivory paper and its shadows. Dark and
  // saturated pens, markers, fingers and other foreground objects occlude ink.
  // Multiply then retains the photographed paper texture and warm illumination.
  const { data: raw, info } = await sharp(photo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = Buffer.alloc(info.width * info.height);
  const clamp = value => Math.max(0, Math.min(1, value));
  for (let i = 0; i < mask.length; i++) {
    const r = raw[i * 3], g = raw[i * 3 + 1], b = raw[i * 3 + 2];
    const low = Math.min(r, g, b), range = Math.max(r, g, b) - low;
    mask[i] = Math.round(255 * clamp((low - 65) / 35) * clamp((68 - range) / 18));
  }
  return data(await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } }).blur(0.35).png().toBuffer(), 'image/png');
}

async function buildProductScene({ photo, paperQuad, screenQuad, paperRotation = 180, screenRotation = 180, root = defaultRoot }) {
  const sharp = require(path.join(root, 'admin/node_modules/sharp'));
  const photoBytes = Buffer.isBuffer(photo) ? photo : await fs.readFile(photo);
  const [paper, screen] = await Promise.all([
    fs.readFile(path.join(root, PAPER_SOURCE)),
    fs.readFile(path.join(root, SCREEN_SOURCE))
  ]);
  const [meta, paperMeta, screenMeta] = await Promise.all([
    sharp(photoBytes).metadata(), sharp(paper).metadata(), sharp(screen).metadata()
  ]);
  if (!meta.width || !meta.height || meta.pages > 1) throw Error('A single still photograph is required');
  if (paperMeta.width !== 703 || paperMeta.height !== 597 || screenMeta.width !== 716 || screenMeta.height !== 1132) {
    throw Error('Approved paper or game screenshot dimensions changed');
  }
  const [photoJpeg, paperPng, screenPng, paperMask] = await Promise.all([
    sharp(photoBytes).jpeg({ quality: 96 }).toBuffer(),
    sharp(paper).png().toBuffer(), sharp(screen).png().toBuffer(), paperSurface(photoBytes, sharp)
  ]);
  const p = mesh('real-paper', orient(paperQuad, paperRotation), paperMeta.width, paperMeta.height);
  const s = mesh('real-screen', orient(screenQuad, screenRotation), screenMeta.width, screenMeta.height);
  const defs = `<image id="real-paper" xlink:href="${data(paperPng, 'image/png')}" width="${paperMeta.width}" height="${paperMeta.height}"/>` +
    `<image id="real-screen" xlink:href="${data(screenPng, 'image/png')}" width="${screenMeta.width}" height="${screenMeta.height}"/>` + p.defs + s.defs +
    `<mask id="paper-surface" maskUnits="userSpaceOnUse" x="0" y="0" width="${meta.width}" height="${meta.height}"><image xlink:href="${paperMask}" width="${meta.width}" height="${meta.height}"/></mask>` +
    `<clipPath id="physical-phone-glass"><path d="${roundedQuad(screenQuad, 3)}"/></clipPath>`;
  const body = `<image xlink:href="${data(photoJpeg, 'image/jpeg')}" width="${meta.width}" height="${meta.height}"/>` +
    `<g mask="url(#paper-surface)" style="mix-blend-mode:multiply">${p.body}</g>` +
    `<g clip-path="url(#physical-phone-glass)" style="mix-blend-mode:screen">${s.body}</g>`;
  return {
    defs, body, width: meta.width, height: meta.height,
    screenSource: SCREEN_SOURCE, paperSource: PAPER_SOURCE,
    sourceHashes: { photo: hash(photoBytes), paper: hash(paper), screen: hash(screen) }
  };
}

module.exports = { buildProductScene, solve, projection, orient, roundedQuad, mesh, paperSurface };
