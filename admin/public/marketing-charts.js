const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>value==null?'Nedostupné':new Intl.NumberFormat('sk-SK').format(value);
const pct=value=>value==null?'Nedostupné':new Intl.NumberFormat('sk-SK',{maximumFractionDigits:1}).format(value*100)+' %';
const shortDate=value=>value.slice(8,10)+'.'+value.slice(5,7)+'.';
let scrollObserver;
export function paymentLink(d){
 const params=new URLSearchParams({scope:'funnel',period:'custom',from:d.filters.from,to:d.filters.to,asOf:String(d.generatedAt)});
 for(const key of ['source','campaign','device','product'])if(d.filters[key])params.set(key,d.filters[key]);
 return '#payments?'+params;
}
function chartSvg(days,unique,sourceNames,traffic){
 const key=unique?'uniqueVisitors':'visits',checkoutKey=unique?'uniqueCheckouts':'checkouts';
 const width=Math.max(760,days.length*9),height=250,left=44,bottom=214,top=20,step=(width-left-14)/Math.max(1,days.length);
 const max=Math.max(4,Math.ceil(Math.max(0,...days.map(day=>day[key]||0))/4)*4),y=value=>bottom-value/max*(bottom-top);
 const axes=Array.from({length:5},(_,i)=>{const value=max*i/4,at=y(value);return `<line class="chart-grid" x1="${left}" x2="${width-14}" y1="${at}" y2="${at}"/><text class="chart-axis" x="${left-8}" y="${at+4}" text-anchor="end">${num(value)}</text>`;}).join('');
 const lines=[];
 if(!traffic)for(const field of [key,checkoutKey]){
  let points=[];const flush=()=>{if(points.length)lines.push(`<polyline class="${field===key?'chart-visits-line':'chart-checkout-line'}" points="${points.join(' ')}"/>`);points=[];};
  days.forEach((day,i)=>{if(day[field]==null)flush();else points.push(`${left+step*(i+.5)},${y(day[field])}`);});flush();
 }
 const bars=days.map((day,i)=>{
  const x=left+step*i,barWidth=Math.max(2,step-Math.min(6,step*.3)),at=x+(step-barWidth)/2;
  let shapes='';
  if(day[key]==null)shapes=`<rect class="chart-unavailable" x="${at}" y="${top}" width="${barWidth}" height="${bottom-top}"/>`;
  else if(traffic){let total=0;for(const source of day.sources){const value=source[key]||0;if(value){shapes+=`<rect class="chart-source-${source.source}" x="${at}" y="${y(total+value)}" width="${barWidth}" height="${value/max*(bottom-top)}"/>`;total+=value;}}if(!total)shapes=`<line class="chart-zero" x1="${at}" x2="${at+barWidth}" y1="${bottom}" y2="${bottom}"/>`;}
  else shapes=`<circle class="chart-visits-point" cx="${x+step/2}" cy="${y(day[key])}" r="3"/><circle class="chart-checkout-point" cx="${x+step/2}" cy="${y(day[checkoutKey])}" r="3"/>`;
  const partial=unique?day.uniquePartial:day.partial;
  const label=i%Math.ceil(days.length/8)===0||i===days.length-1?`<text class="chart-axis" x="${x+step/2}" y="239" text-anchor="middle">${shortDate(day.date)}</text>`:'';
  const description=`${day.date}: ${num(day[key])} ${unique?'unikátnych prehliadačov':'návštev'}, checkout ${num(day[checkoutKey])}${partial?', čiastočné meranie':''}`;
  return `<g class="marketing-chart-day" tabindex="${i===0?'0':'-1'}" role="img" aria-label="${esc(description)}" data-marketing-day="${day.date}" data-marketing-day-index="${i}"><title>${esc(description)}</title><rect class="chart-hit" x="${x}" y="${top}" width="${step}" height="${bottom-top}"/>${shapes}${partial?`<text class="chart-partial" x="${x+step/2}" y="14" text-anchor="middle">*</text>`:''}${label}</g>`;
 }).join('');
 return `<div class="marketing-chart-scroll" tabindex="0" role="region" aria-label="${traffic?'Denná návštevnosť podľa zdroja':'Denný vývoj návštev a checkoutu'}; na úzkej obrazovke posúvajte vodorovne"><svg class="marketing-chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="${traffic?'Návštevnosť podľa zdroja':'Návštevy a checkout'}" role="group">${axes}${bars}${lines.join('')}</svg></div>`;
}
export function chartContent(d,unique,sourceNames){
 const charts=d.charts,days=charts?.days||[],key=unique?'uniqueVisitors':'visits',checkoutKey=unique?'uniqueCheckouts':'checkouts';
 if(!days.length)return '<p class="marketing-chart-note">Denné údaje zatiaľ nie sú dostupné.</p>';
 const total=unique?charts.uniqueVisitors:days.some(day=>day.visits!=null)?days.reduce((sum,day)=>sum+(day.visits||0),0):null;
 const checkouts=unique?charts.uniqueCheckouts:days.some(day=>day.checkouts!=null)?days.reduce((sum,day)=>sum+(day.checkouts||0),0):null;
 const active=Object.keys(sourceNames).filter(source=>days.some(day=>day.sources.some(row=>row.source===source&&row[key]>0)));
 const partial=unique?charts.uniquePartial:charts.visitPartial;
 const caption=unique?'Unikátne prehliadače':'Návštevné relácie';
 const note=unique?`Unikátne prehliadače meriame od ${charts.uniqueStartedAt?new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(charts.uniqueStartedAt):'začiatku nového merania'}. Jeden človek na dvoch zariadeniach sa môže započítať dvakrát. Súčet denných unikátnych hodnôt nie je celkový počet za obdobie.`:'Každá relácia sa počíta raz, vrátane opakovaných návštev jedného prehliadača. Nová relácia vzniká po 30 minútach neaktivity alebo v novej karte.';
 return `<div class="marketing-chart-stats"><div><span>${caption} za obdobie</span><strong>${num(total)}</strong></div><div><span>${unique?'Prehliadače, ktoré otvorili checkout':'Relácie, ktoré otvorili checkout'}</span><strong>${num(checkouts)}</strong></div><div><span>Podiel so vstupom do checkoutu</span><strong>${pct(total>0?checkouts/total:null)}</strong></div></div><p class="marketing-chart-note">${note}${partial?' Zvolené obdobie je pokryté len čiastočne.':''} Tmavé pruhy znamenajú nedostupné meranie; hviezdička označuje čiastočný deň.</p>
 <figure class="marketing-chart"><figcaption><h3>Návštevnosť po dňoch a zdrojoch</h3><span>${caption} · Bratislava</span></figcaption><ul class="marketing-chart-legend" aria-label="Zdroje návštevnosti">${active.map(source=>`<li><i class="chart-source-${source}" aria-hidden="true"></i>${esc(sourceNames[source])}</li>`).join('')}</ul>${chartSvg(days,unique,sourceNames,true)}<p class="marketing-chart-readout" aria-live="polite">Vyberte deň kurzorom, dotykom alebo šípkami na klávesnici.</p></figure>
 <figure class="marketing-chart"><figcaption><h3>Od návštevy k checkoutu</h3><span>Podľa dňa začiatku návštevy</span></figcaption><ul class="marketing-chart-legend"><li><i class="chart-source-direct" aria-hidden="true"></i>${caption}</li><li><i class="chart-checkout-point" aria-hidden="true"></i>Dosiahnutý checkout</li></ul>${chartSvg(days,unique,sourceNames,false)}<p class="marketing-chart-readout" aria-live="polite">Návšteva aj jej checkout patria do rovnakého dňa návštevnej kohorty.</p></figure>
 <details class="marketing-chart-data"><summary>Denné hodnoty a metodika</summary><p class="marketing-chart-note">${esc(charts.methodology)}</p><div class="marketing-chart-table-wrap"><table><thead><tr><th>Deň</th><th>${caption}</th><th>Checkout</th><th>Podiel</th></tr></thead><tbody>${days.map(day=>`<tr><th scope="row">${day.date}${(unique?day.uniquePartial:day.partial)?' *':''}</th><td>${num(day[key])}</td><td>${num(day[checkoutKey])}</td><td>${pct(unique?day.uniqueCheckoutRate:day.checkoutRate)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
export function bindChartDays(root,d,unique,sourceNames){
 scrollObserver?.disconnect();
 scrollObserver=new ResizeObserver(entries=>entries.forEach(({target})=>{if(!target.isConnected)scrollObserver.unobserve(target);else target.scrollLeft=Math.max(0,target.scrollWidth-target.clientWidth);}));
 root.querySelectorAll('.marketing-chart-scroll').forEach(element=>scrollObserver.observe(element));
 const key=unique?'uniqueVisitors':'visits',checkoutKey=unique?'uniqueCheckouts':'checkouts';
 const reveal=target=>{
  const day=d.charts?.days.find(day=>day.date===target.dataset.marketingDay);if(!day)return;
  const sources=day.sources.filter(row=>row[key]>0).map(row=>sourceNames[row.source]+': '+num(row[key])).join(' · ');
  target.closest('figure').querySelector('.marketing-chart-readout').textContent=`${day.date} · ${unique?'Unikátne prehliadače':'Návštevy'}: ${num(day[key])} · Checkout: ${num(day[checkoutKey])} · Podiel: ${pct(unique?day.uniqueCheckoutRate:day.checkoutRate)}${sources?' · '+sources:''}${(unique?day.uniquePartial:day.partial)?' · čiastočné meranie':''}`;
 };
 root.querySelectorAll('[data-marketing-day]').forEach(target=>{
  target.addEventListener('pointerenter',()=>reveal(target));target.addEventListener('click',()=>reveal(target));target.addEventListener('focus',()=>reveal(target));
  target.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const all=[...target.closest('svg').querySelectorAll('[data-marketing-day]')],index=Number(target.dataset.marketingDayIndex),next=event.key==='Home'?0:event.key==='End'?all.length-1:Math.max(0,Math.min(all.length-1,index+(event.key==='ArrowRight'?1:-1)));all.forEach(el=>el.setAttribute('tabindex','-1'));all[next].setAttribute('tabindex','0');all[next].focus();});
 });
}
