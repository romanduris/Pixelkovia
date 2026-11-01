(() => {
'use strict';
document.querySelector('#print-materials-button').addEventListener('click',()=>window.print());
document.querySelector('#printable-sheets').innerHTML=PRINT_MATERIALS.parentGuide()+Object.values(PRINT_MATERIALS.sheets).join('');
// A player link reveals only the requested sheet; parent print navigation keeps the full set.
const selected = new URLSearchParams(location.search).get('sheet');
if (Object.hasOwn(PRINT_MATERIALS.sheets,selected||'') || selected==='rodicovsky-navod') {
  document.querySelectorAll('.sheet').forEach(sheet => { sheet.hidden = sheet.id !== selected; });
  document.querySelector('header nav').hidden = true;
  document.querySelector('#pdf-download').href = 'assets/printables/'+selected+'.pdf';
  document.querySelector('header p').textContent = 'Pracovný list pre váš tím. Tlačte jednostranne na biely papier, v mierke 100 %. Farebná aj čiernobiela tlač sú hrateľné.';
}

const ring = (size,radius,label) => {const c=size/2;const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter,i)=>{const angle=i*360/26,rad=angle*Math.PI/180;return `<text x="${c+radius*Math.sin(rad)}" y="${c-radius*Math.cos(rad)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${angle} ${c+radius*Math.sin(rad)} ${c-radius*Math.cos(rad)})" font-size="15" font-family="monospace" fill="#263c36">${letter}</text>`;}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label} kruh A až Z"><circle cx="${c}" cy="${c}" r="${c-2}" fill="#fffdf7" stroke="#263c36" stroke-dasharray="4 3"/><circle cx="${c}" cy="${c}" r="${radius-15}" fill="none" stroke="#b0b6a8"/>${letters}<path d="M${c-7} ${c}h14M${c} ${c-7}v14" stroke="#263c36"/><text x="${c}" y="${c+30}" text-anchor="middle" font-size="11" font-family="monospace">${label}</text></svg>`;};
document.querySelector('#circles').innerHTML=ring(320,140,'VONKAJŠÍ')+ring(234,96,'VNÚTORNÝ');
if(location.hash)requestAnimationFrame(()=>document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
})();
