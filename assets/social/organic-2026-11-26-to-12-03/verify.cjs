/* Artifact delivery checks, including exact game inserts and safe typography. */
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const out=__dirname,root=path.resolve(out,'../../..'),sharp=require(path.join(root,'admin/node_modules/sharp'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const assert=(v,s)=>{if(!v)throw Error(s)};
const names=['social_2026-11-26_family_feed','social_2026-11-27_step1','social_2026-11-27_step2','social_2026-11-27_step3','social_2026-11-28_story','social_2026-11-29_sunday_feed','social_2026-11-30_hybrid_feed','social_2026-12-01_winter_story','social_2026-12-02_detectives_feed','social_2026-12-03_invitation_feed'];
const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
async function raw(b){return sharp(b).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true})}
async function main(){
 const m=JSON.parse(await fs.readFile(path.join(out,'artwork.json'),'utf8')),plan=JSON.parse(await fs.readFile(path.join(out,'content-plan.json'),'utf8'));
 assert(m.assets.length===10&&plan.posts.length===8,'Expected10 images and8 daily posts');
 assert(m.publication===false&&m.scheduling===false,'Preparation must not imply publication');
 assert(plan.posts.flatMap(p=>p.files).join('|')===names.map(n=>n+'.png').join('|'),'Publication order differs from brief');
 assert(m.verifiedProduct.priceEUR==='14,99'&&m.verifiedProduct.puzzles===7,'Verified current product metadata changed');
 const originals={};for(const [id,file]of[['real-paper','assets/sales/public-previews/decoder.webp'],['real-screen','assets/sales/game-lock-partial.webp']])originals[id]=await raw(await fs.readFile(path.join(root,file)));
 for(let n=0;n<m.assets.length;n++){
  const e=m.assets[n],name=names[n],H=name.endsWith('_story')?1920:1350;
  assert(e.file===name+'.png'&&e.dimensions[0]===1080&&e.dimensions[1]===H,'Wrong filename or manifest dimensions: '+name);
  const png=await fs.readFile(path.join(out,e.file)),meta=await sharp(png).metadata();
  assert(meta.format==='png'&&meta.width===1080&&meta.height===H&&meta.space==='srgb'&&!meta.hasAlpha,'Wrong PNG format: '+name);
  assert(hash(png)===e.sha256,'PNG hash changed: '+name);
  const z=e.safeArea;
  assert(z.left>=1080*.06&&z.right<=1080*.94&&z.top>=(H===1920?288:81)&&z.bottom<=(H===1920?1536:1269),'Insufficient safe zone: '+name);
  for(const t of e.textBounds)assert(t.x>=z.left&&t.y>=z.top&&t.x+t.width<=z.right&&t.y+t.height<=z.bottom,'Unsafe text '+name+': '+t.text);
  if(e.sticker){const s=e.sticker;assert(s.x>=z.left&&s.y>=z.top&&s.x+s.width<=z.right&&s.y+s.height<=z.bottom,'Unsafe sticker '+name);assert(e.textBounds.every(t=>!intersects(t,s)),'Sticker overlaps text '+name)}
  for(const [kind,b]of Object.entries(e.productBounds)){
   assert(b.every(Number.isFinite)&&b[0]>=0&&b[1]>=0&&b[0]+b[2]<=1080&&b[1]+b[3]<=H,'Product outside canvas '+name+' '+kind);
   if(H===1920&&kind==='screen')assert(b[1]+b[3]<1536,'Story phone obscured by UI '+name);
  }
  const svg=await fs.readFile(path.join(out,e.editable),'utf8');assert(!/<script|<foreignObject|\son[a-z]+\s*=/i.test(svg),'Active SVG content: '+name);
  for(const a of svg.matchAll(/(?:\bxlink:)?\bhref\s*=\s*(["'])(.*?)\1/gi))assert(a[2].startsWith('#')||a[2].startsWith('data:'),'External SVG reference: '+name);
  for(const [id,expected]of Object.entries(originals)){
   const tag=[...svg.matchAll(/<image\b[^>]*>/g)].map(x=>x[0]).find(x=>x.includes(`id="${id}"`));
   if(!tag)continue;
   const b64=tag.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);assert(b64,'Missing exact embedded product: '+name);
   const p=await raw(Buffer.from(b64[1],'base64'));assert(p.info.width===expected.info.width&&p.info.height===expected.info.height&&p.data.equals(expected.data),'Altered original product pixels: '+name+' '+id);
  }
  if(e.sources.screen)assert(e.sources.screen.rotation===180,'Phone must face family: '+name);
  console.log('PASS '+e.file+' · '+1080+'×'+H+' · sRGB · measured safe copy · original product');
 }
 console.log('PASS10/10 organic visuals,8days,3ordered carousel frames,2native-sticker reservations');
}
main().catch(e=>{console.error('FAIL '+e.message);process.exitCode=1});
