// Build a public sales-only artifact. Never recursively copy game assets here.
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
export async function prepareFunnel(output){
  await mkdir(output,{recursive:true});
  const content={window:{},URL};
  vm.createContext(content);
  // Authored sources are read only during the build, never published as game JS.
  vm.runInContext(await readFile(path.join(root,'site-config.js'),'utf8'),content);
  const config=content.window.SITE_CONFIG;
  const authored={window:{}};
  vm.runInNewContext(await readFile(path.join(root,'game-data.js'),'utf8'),authored);
  const characters=authored.window.GAME.characters.map(({id,name,role})=>({id,name,role}));
  content.SITE_CONFIG=config;
  vm.runInContext(await readFile(path.join(root,'library-catalog.js'),'utf8'),content);
  content.PIXELKOVIA_LIBRARY=content.window.PIXELKOVIA_LIBRARY;
  content.document={addEventListener(){}};
  vm.runInContext(await readFile(path.join(root,'book-previews.js'),'utf8'),content);
  content.PIXELKOVIA_BOOK_PREVIEWS=content.window.PIXELKOVIA_BOOK_PREVIEWS;
  content.GAME={characters};
  vm.runInContext(await readFile(path.join(root,'sales-page.js'),'utf8'),content);
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sprite=id=>{
    const c=characters.find(c=>c.id===id);
    if(!c||!/^[a-z]+$/.test(id))throw Error('Unknown public character');
    return `<span class="pixel-sprite" role="img" aria-label="${escape(c.name)}" style="--character-image:url('assets/sales/characters/${id}.webp')"></span>`;
  };
  let markup=content.window.SALES_PAGE.render({sprite});
  const previews={
    'assets/miky-sheet-preview.webp':'assets/sales/public-previews/signals.webp',
    'assets/printables/p2-preview.webp':'assets/sales/public-previews/decoder.webp',
    'assets/printables/p4-preview.webp':'assets/sales/public-previews/path.webp'
  };
  for(const [original,crop]of Object.entries(previews))markup=markup.replaceAll(original,crop);
  let index=await readFile(path.join(root,'index.html'),'utf8');
  index=index.replace(/\s*<script\b[^>]*>[\s\S]*?<\/script>/g,'')
    .replace('</head>','  <link rel="canonical" href="https://pixelkovia.rodulab.com/">\n  <script defer src="library-catalog.js"></script>\n  <script defer src="book-previews.js"></script>\n  <script defer src="sales-interactions.js"></script>\n</head>')
    .replace('<main id="app"></main>',`<main id="app">${markup}</main>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/,'<noscript><p>Výber doplnkov v ponuke vyžaduje JavaScript.</p></noscript>')
    .replace(/\s*<dialog id="modal"[^>]*><\/dialog>/,'');
  let checkout=await readFile(path.join(root,'checkout.html'),'utf8');
  checkout=checkout.replace('src="site-config.js"','src="purchase-config.js"');
  // Reuse the same price functions and data without publishing access/admin code.
  const purchaseConfig=`/* Generated public catalog. Access and payment readiness are server-owned. */\n(()=>{\nconst products=${JSON.stringify(config.products)};\nconst offer=${JSON.stringify(config.offer)};\nconst payments=${JSON.stringify(config.payments)};\nconst money=(${config.money.toString()});\nconst product=(${config.product.toString()});\nconst quote=(${config.quote.toString()});\nconst managementUrl=()=>location.origin+'/admin';\nwindow.SITE_CONFIG={products,offer,money,product,quote,payments,managementUrl};\n})();\n`;
  await writeFile(path.join(output,'purchase-config.js'),purchaseConfig);
  const code=['supervisor.js','supervisor.css','portal-library.js','portal-library.css','book-previews.js','book-previews.css','styles.css','adventure.css','presentation.css','party.css','sales.css','checkout.css','checkout.js','sales-interactions.js','library.css','library.js','library-catalog.js'];
  for(const file of code)await cp(path.join(root,file),path.join(output,file));
  const assets=[
    'favicon.ico','assets/brand/piko-32.png','assets/brand/piko-192.png','assets/brand/piko-180.png',
    'assets/pixelkovia-room-desktop.webp','assets/pixelkovia-room-mobile.webp',
    ...['opening','lock','code'].flatMap(scene=>['','-medium','-small'].map(size=>`assets/sales/family-${scene}-mobile${size}.webp`)),
    'assets/sales/game-lock-partial.webp','assets/fonts/Caveat.ttf',
    'assets/books/before-cover.webp','assets/books/after-cover.webp',
    ...['before','after'].flatMap(key=>[1,2].map(i=>`assets/sales/books/${key}-page-${i}.webp`)),
    ...characters.map(c=>`assets/atlas/${c.id}.webp`),
    ...characters.map(c=>`assets/sales/characters/${c.id}.webp`),...Object.values(previews)
  ];
  for(const asset of assets){await mkdir(path.dirname(path.join(output,asset)),{recursive:true});await cp(path.join(root,asset),path.join(output,asset));}
  const versioned=async html=>{
    const hashes=new Map();
    for(const file of [...code,'purchase-config.js'])hashes.set(file,createHash('sha256').update(await readFile(path.join(output,file))).digest('hex').slice(0,12));
    return html.replace(/\b(src|href)="([\w.-]+\.(?:js|css))"/g,(all,attr,file)=>hashes.has(file)?`${attr}="${file}?v=${hashes.get(file)}"`:all);
  };
  await writeFile(path.join(output,'index.html'),await versioned(index));
  await writeFile(path.join(output,'checkout.html'),await versioned(checkout));
  // The public library has only the free Atlas, metadata and two-paragraph samples.
  for(const file of ['supervisor.html','atlas.html','library.html','book-before-sample.html','book-after-sample.html']){
    await writeFile(path.join(output,file),await versioned(await readFile(path.join(root,file),'utf8')));
  }
  for(const file of ['404.html','_headers','robots.txt','sitemap.xml'])await cp(path.join(root,'funnel',file),path.join(output,file));
  console.log(`Public sales-only funnel prepared (${assets.length} approved assets; free Atlas and book samples; no full books, game, solutions or PDFs).`);
}
