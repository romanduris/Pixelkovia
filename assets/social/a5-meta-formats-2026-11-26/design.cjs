/* Native, editable typography for the approved A5 concept in four Meta formats.
 * Coordinates describe final canvases; the caller owns the photographed scene
 * and exact game-material planes. Decorative gradients end around the safe
 * information band, leaving the reserved CTA area as photographed scenery.
 */
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[char]));

const cream = '#fff7ea';
const mint = '#b4efd6';
const lavender = '#d3bdff';
const configurations = {
  '4x5': {
    x: 76, brand: [121, 32], kicker: [140, 17],
    headlineY: [209, 291], headlineSize: [65, 112],
    supportY: [342, 379], supportSize: 30,
    factsY: [916, 955, 994], factsSize: 34, factCenters: [84, 84, 84], factAnchor: 'start',
    url: [84, 1043, 27], urlAnchor: 'start',
    mascot: [625, 93, 105],
    headerHeight: 405, information: [0, 0], localInformation: true, sideInformation: [190, 970, 190, 135], footerLineY: 1008, lineLocal: true,
    flourish: 'M110 308Q250 297 402 307'
  },
  '1x1': {
    x: 76, brand: [102, 29], kicker: [130, 17],
    headlineY: [184, 255], headlineSize: [54, 96],
    supportY: [292, 325], supportSize: 28.5,
    factsY: [692, 730, 768], factsSize: 30, factCenters: [84, 84, 84], factAnchor: 'start',
    url: [84, 810, 27], urlAnchor: 'start', mascot: [600, 75, 100],
    headerHeight: 351, information: [0, 0], localInformation: true, sideInformation: [190, 746, 190, 112], footerLineY: 780, lineLocal: true
  },
  '9x16': {
    x: 76, brand: [345, 34], kicker: [375, 19],
    headlineY: [454, 550], headlineSize: [71, 123],
    supportY: [606, 644], supportSize: 31,
    factsY: [1365, 1406, 1447], factsSize: 33, factCenters: [84, 84, 84], factAnchor: 'start',
    url: [76, 700, 30], urlAnchor: 'start',
    mascot: [700, 320, 116],
    headerHeight: 725, information: [0, 0], localInformation: true, sideInformation: [170, 1410, 130, 105], hideFooterLine: true,
    flourish: 'M110 570Q260 558 460 569'
  },
  '191x1': {
    x: 84, brand: [84, 29], kicker: [111, 17],
    headlineY: [185, 273], headlineSize: [53, 105],
    supportY: [324, 363], supportSize: 30,
    factsY: 440, factsSize: 30, factCenters: [170, 355, 550],
    url: [360, 480, 30], mascot: [525, 45, 90],
    footerLineY: 451, flourish: 'M110 289Q240 279 380 288',
    landscape: true
  }
};

const copy = {
  headline: ['Dnes večer hráte', 'spolu.'],
  support: ['Papierové indície. Príbeh v mobile.', 'Dobrodružstvo pre deti aj rodičov.'],
  facts: ['7 hádaniek', '7–13 rokov', '60–90 min']
};

function textSvg(record) {
  const spacing = record.letterSpacing === undefined ? '' : ` letter-spacing="${record.letterSpacing}"`;
  return `<text x="${record.x}" y="${record.y}" font-family="${esc(record.font)}" font-weight="${record.weight}" font-size="${record.size}" text-anchor="${record.anchor}" fill="${record.fill}"${spacing}>${esc(record.text)}</text>`;
}

function lineIcons(centers, bottom) {
  const [puzzleX, familyX, clockX] = centers;
  const center = bottom - 18;
  return `<g stroke="${mint}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="translate(${puzzleX - 18} ${bottom - 36}) scale(.8)"><path d="M0 14V4h12Q8-9 18-9T24 4h12v12q13-4 13 6t-13 6v12H24q4 13-6 13T12 40H0V28q-13 4-13-6T0 16z"/></g><g transform="translate(${familyX} ${bottom - 12})"><circle cx="0" cy="-16" r="7"/><circle cx="-18" cy="-10" r="5"/><circle cx="18" cy="-10" r="5"/><path d="M-12 10V4q0-15 12-15T12 4v6M-25 10V6q0-12 9-12M25 10V6q0-12-9-12"/></g><circle cx="${clockX}" cy="${center}" r="18"/><path d="M${clockX} ${center - 12}v13l10 6"/></g>`;
}

module.exports = function design({ id, W, H, fontCss = '', productDefs = '', sceneBody = '', headerMascotUri }) {
  const config = configurations[id];
  if (!config) throw Error('Unknown A5 format: ' + id);
  const textRecords = [];
  const graphicBounds = [];
  const addText = (role, text, x, y, size, options = {}) => {
    const record = {
      role, text, x, y, size, font: 'Manrope', weight: 800,
      anchor: 'start', fill: cream, ...options
    };
    textRecords.push(record);
    return textSvg(record);
  };

  const markSize = Math.round(config.brand[1] * .31);
  const markStep = markSize + 4;
  const markHeight = 2 * markSize + 4;
  const markTop = config.brand[0] - markHeight;
  const logo = [[0, 0], [markStep, 0], [0, markStep], [markStep, markStep]].map(([dx, dy]) => {
    const bounds = { x: config.x + dx, y: markTop + dy, width: markSize, height: markSize, role: 'logo' };
    graphicBounds.push(bounds);
    return `<rect x="${bounds.x}" y="${bounds.y}" width="${markSize}" height="${markSize}" rx="2"/>`;
  }).join('');

  const brand = `<g fill="${mint}">${logo}</g>` +
    addText('brand', 'Pixelkovia', config.x + markHeight + 19, config.brand[0], config.brand[1]) +
    addText('kicker', 'RODINNÁ HRA NA DOMA', config.x, config.kicker[0], config.kicker[1], {
      font: 'DM Sans', weight: 500, fill: mint, letterSpacing: 1.6
    });

  const headlines = copy.headline.map((line, index) => addText(
    'headline', line, config.x, config.headlineY[index], config.headlineSize[index],
    index === 1 ? { font: 'Caveat', weight: 400, fill: lavender } : {}
  )).join('');
  const supportLines = config.supportSingleLine ? [copy.support.join(' ')] : copy.support;
  const support = supportLines.map((line, index) => addText(
    'support', line, config.x, config.supportY[index], config.supportSize,
    { font: 'DM Sans', weight: 500 }
  )).join('');
  const facts = copy.facts.map((line, index) => addText(
    'fact', line, config.factCenters[index], Array.isArray(config.factsY) ? config.factsY[index] : config.factsY, config.factsSize,
    { anchor: config.factAnchor || 'middle', fill: index === 0 ? mint : cream }
  )).join('');
  const url = addText('url', 'pixelkovia.rodulab.com', ...config.url, {
    font: 'DM Sans', weight: 500, anchor: config.urlAnchor || 'middle', fill: mint
  });

  const icons = config.iconsBottom === undefined ? '' : lineIcons(config.factCenters, config.iconsBottom);
  const flourish = config.flourish ? `<path d="${config.flourish}" fill="none" stroke="#ffe4a8" stroke-opacity=".85" stroke-width="2.2" stroke-linecap="round"/>` : '';
  const [mascotX, mascotY, mascotSize] = config.mascot;
  const mascot = headerMascotUri ? `<image xlink:href="${esc(headerMascotUri)}" x="${mascotX}" y="${mascotY}" width="${mascotSize}" height="${mascotSize}"/>` : '';

  let readability;
  let gradientDefs;
  let footerLine;
  if (config.landscape) {
    gradientDefs = `<linearGradient id="left-readability" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#071327" stop-opacity=".62"/><stop offset=".73" stop-color="#071327" stop-opacity=".42"/><stop offset="1" stop-color="#071327" stop-opacity="0"/></linearGradient><linearGradient id="left-bottom-fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white"/><stop offset=".85" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="left-fade"><rect width="690" height="516" fill="url(#left-bottom-fade)"/></mask>`;
    readability = '<rect width="690" height="516" fill="url(#left-readability)" mask="url(#left-fade)"/>';
    footerLine = `<path d="M90 ${config.footerLineY}H302l10-2h10l10 4h14l10-2h276" fill="none" stroke="${mint}" stroke-width="1.7" stroke-opacity=".85"/>`;
  } else {
    gradientDefs = '<linearGradient id="header-readability" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#071327" stop-opacity=".48"/><stop offset=".7" stop-color="#071327" stop-opacity=".23"/><stop offset="1" stop-color="#071327" stop-opacity="0"/></linearGradient><linearGradient id="information-readability" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#091327" stop-opacity="0"/><stop offset=".22" stop-color="#091327" stop-opacity=".57"/><stop offset=".73" stop-color="#091327" stop-opacity=".65"/><stop offset="1" stop-color="#091327" stop-opacity="0"/></linearGradient>';
    if (config.localInformation) gradientDefs += '<radialGradient id="side-information-readability"><stop stop-color="#091327" stop-opacity=".68"/><stop offset=".7" stop-color="#091327" stop-opacity=".4"/><stop offset="1" stop-color="#091327" stop-opacity="0"/></radialGradient>';
    const [sideX, sideY, sideRX, sideRY] = config.sideInformation || [164, 750, 190, 110];
    const sideReadability = config.localInformation ? `<ellipse cx="${sideX}" cy="${sideY}" rx="${sideRX}" ry="${sideRY}" fill="url(#side-information-readability)"/>` : '';
    readability = `<rect width="${W}" height="${config.headerHeight}" fill="url(#header-readability)"/>${sideReadability}<rect x="0" y="${config.information[0]}" width="${W}" height="${config.information[1]}" fill="url(#information-readability)"/>`;
    footerLine = config.hideFooterLine ? '' : config.lineLocal ? `<path d="M84 ${config.footerLineY}H360" fill="none" stroke="${mint}" stroke-width="1.8" stroke-opacity=".8"/>` : `<path d="M84 ${config.footerLineY}H482l17-3h17l17 6h26l18-3h419" fill="none" stroke="${mint}" stroke-width="2" stroke-opacity=".85"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc('Pixelkovia · A5 · ' + id)}</title><desc>Adaptácia schváleného reklamného konceptu A5. Ilustračná generovaná rodinná scéna, upraviteľná typografia a presné schválené herné podklady.</desc><style>${fontCss}</style><defs>${productDefs}${gradientDefs}</defs>${sceneBody}${readability}${brand}${headlines}${mascot}${flourish}${support}${icons}${facts}${footerLine}${url}</svg>`;
  return { svg, textRecords, graphicBounds };
};
