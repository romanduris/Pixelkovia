/* Editable campaign art direction: original room, restrained miniatures, game first. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const text=(s,x,y,size,{font='Manrope',fill='#fff7ea',anchor='start',weight=800,extra=''}={})=>`<text x="${x}" y="${y}" font-family="${font}" font-weight="${weight}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" ${extra}>${esc(s)}</text>`;
function miniature(m,uris){
  const h=m.h||m.w,x=m.x,y=m.y,w=m.w;
  const seated=m.type!=='piko-peeking',contact=y+h*(seated?.76:.92);
  const shadow=m.layer==='letter'?'':`<ellipse cx="${x+w*.5}" cy="${contact}" rx="${w*.29}" ry="${w*.055}" fill="#221308" opacity=".4" filter="url(#soft-shadow)"/>`;
  return `<g data-mascot="${m.type}" transform="rotate(${m.rotate||0} ${x+w/2} ${y+h/2})">${shadow}<image xlink:href="${uris[m.type]}" x="${x}" y="${y}" width="${w}" height="${h}"/></g>`;
}
module.exports=function design({W,H,item,copy,fontCss,paperUri,actualUri,pm,screenMeta,productDefs,photoGroup,provenance,mascotUris}){
  let headline='';
  copy.headline.forEach((line,i)=>{
    const last=i===copy.headline.length-1,script=last&&[0,3,4].includes(item.angle);
    const size=script?(item.angle===0?94:item.angle===3?104:111):(item.angle===1?63:65);
    const y=script?(item.angle===0?330:273):165+i*73;
    headline+=text(line,58,y,size,{font:script?'Caveat':'Manrope',weight:script?400:800,fill:script?'#d3bdff':last?'#b4efd6':'#fff7ea'});
  });
  const supportY=item.angle===0?396:327;
  const support=copy.support.map((line,i)=>text(line,60,supportY+i*37,31,{font:'DM Sans',weight:500})).join('');
  const flourish=item.angle===0?'<path d="M160 350Q320 335 524 349" stroke="#ffe4a8"/>':[1,2].includes(item.angle)?'<path d="M180 266Q395 253 688 265" stroke="#7eeafa"/>':'<path d="M122 293Q272 282 470 291" stroke="#d3bdff"/>';
  const facts=[['7 hádaniek',210],['7–13 rokov',540],['60–90 min',870]].map(([s,x],i)=>text(s,x,1248,34,{anchor:'middle',fill:i?'#fff7ea':'#b4efd6'})).join('');
  const icons=`<g stroke="#b4efd6" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M195 1197v-9h10q-4-13 6-13t6 13h10v10q13-5 13 6t-13 6v9h-11q4 13-6 13t-6-13h-9v-10q-13 4-13-6t13-6z" transform="translate(0 -9) scale(.98)"/><g transform="translate(540 1196)"><circle cx="0" cy="-13" r="7"/><circle cx="-18" cy="-7" r="5"/><circle cx="18" cy="-7" r="5"/><path d="M-12 13v-6q0-15 12-15t12 15v6M-25 13v-4q0-12 9-12M25 13v-4q0-12-9-12"/></g><circle cx="870" cy="1197" r="20"/><path d="M870 1183v15l11 6"/></g>`;
  const mascots=(item.mascots||[]).map(m=>miniature(m,mascotUris)).join('');
  const sparkles=(item.sparkles||[]).map(([x,y,size])=>`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" fill="#fff0a8" stroke="#ffc83d" stroke-width="1.2" filter="url(#pixel-glow)" opacity=".85"/>`).join('');
  const brand=`<g fill="#b4efd6">${[[60,35],[76,35],[60,51],[76,51]].map(([x,y])=>`<rect x="${x}" y="${y}" width="11" height="11" rx="2"/>`).join('')}</g>${text('Pixelkovia',106,63,33)}${text('RODINNÁ HRA NA DOMA',60,97,19,{font:'DM Sans',weight:500,fill:'#b4efd6',extra:'letter-spacing="1.7"'})}`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(item.id+' · V2 · '+copy.name)}</title><desc>${esc(provenance)}</desc><style>${fontCss}</style><defs><image id="real-paper" xlink:href="${paperUri}" width="${pm.width}" height="${pm.height}"/><image id="real-screen" xlink:href="${actualUri}" width="${screenMeta.width}" height="${screenMeta.height}"/>${productDefs}<linearGradient id="top" x2="0" y2="1"><stop stop-color="#071327" stop-opacity=".56"/><stop offset=".58" stop-color="#071327" stop-opacity=".28"/><stop offset="1" stop-color="#071327" stop-opacity="0"/></linearGradient><linearGradient id="footer" x2="0" y2="1"><stop stop-color="#091327" stop-opacity="0"/><stop offset=".4" stop-color="#091327" stop-opacity=".7"/><stop offset="1" stop-color="#091327" stop-opacity=".94"/></linearGradient><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#fff1da" stop-opacity=".045"/><stop offset="1" stop-color="#000" stop-opacity=".045"/></linearGradient><filter id="soft-shadow" x="-80%" y="-200%" width="260%" height="500%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="pixel-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${photoGroup}<rect width="1080" height="480" fill="url(#top)"/><rect x="0" y="1118" width="1080" height="232" fill="url(#footer)"/>${brand}${headline}<g fill="none" stroke-width="2.5" stroke-linecap="round" opacity=".85">${flourish}</g>${support}${mascots}${sparkles}${icons}${facts}<path d="M84 1281H482l17-8h17l17 16h26l18-8h419" fill="none" stroke="#b4efd6" stroke-width="2.5"/><rect x="81" y="1278" width="6" height="6" fill="#b4efd6"/><rect x="993" y="1278" width="6" height="6" fill="#b4efd6"/>${text('pixelkovia.rodulab.com',540,1326,30,{font:'DM Sans',weight:500,anchor:'middle',fill:'#b4efd6'})}</svg>`;
  return svg;
};
