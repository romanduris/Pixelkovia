const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>value==null?'Nedostupné':new Intl.NumberFormat('sk-SK').format(value);
const shortDate=value=>value.slice(8,10)+'.'+value.slice(5,7)+'.';
let scrollObserver;
export function paymentLink(d){
 const params=new URLSearchParams({scope:'funnel',period:'custom',from:d.filters.from,to:d.filters.to,asOf:String(d.generatedAt)});
 for(const key of ['source','campaign','device','product'])if(d.filters[key])params.set(key,d.filters[key]);
 return '#payments?'+params;
}
function chartSvg(days,unique){
 const key=unique?'uniqueVisitors':'visits';
 // Keep every daily total legible, including longer ranges that scroll horizontally.
 const width=Math.max(760,days.length*26),height=260,left=44,bottom=222,top=28,step=(width-left-14)/Math.max(1,days.length);
 const max=Math.max(4,Math.ceil(Math.max(0,...days.map(day=>day[key]||0))/4)*4),y=value=>bottom-value/max*(bottom-top);
 const axes=Array.from({length:5},(_,i)=>{const value=max*i/4,at=y(value);return `<line class="chart-grid" x1="${left}" x2="${width-14}" y1="${at}" y2="${at}"/><text class="chart-axis" x="${left-8}" y="${at+4}" text-anchor="end">${num(value)}</text>`;}).join('');
 const bars=days.map((day,i)=>{
  const x=left+step*i,barWidth=Math.max(2,step-Math.min(6,step*.3)),at=x+(step-barWidth)/2;
  let shapes='';
  if(day[key]==null)shapes=`<rect class="chart-unavailable" x="${at}" y="${top}" width="${barWidth}" height="${bottom-top}"/>`;
  else {let total=0;for(const source of day.sources){const value=source[key]||0;if(value){shapes+=`<rect class="chart-source-${source.source}" x="${at}" y="${y(total+value)}" width="${barWidth}" height="${value/max*(bottom-top)}"/>`;total+=value;}}if(!total)shapes=`<line class="chart-zero" x1="${at}" x2="${at+barWidth}" y1="${bottom}" y2="${bottom}"/>`;}
  const partial=unique?day.uniquePartial:day.partial;
  // Never crowd the final date against the preceding tick.
  const interval=Math.max(1,Math.ceil(days.length/8));
  const tick=i===days.length-1||(i%interval===0&&days.length-1-i>=Math.max(1,interval*.65));
  const label=tick?`<text class="chart-axis" x="${x+step/2}" y="248" text-anchor="middle">${shortDate(day.date)}</text>`:'';
  const count=day[key]==null?'—':num(day[key]);
  const totalLabel=`<text class="chart-total${day[key]==null?' chart-total-unavailable':''}" x="${x+step/2}" y="${day[key]==null?top-8:y(day[key])-8}" text-anchor="middle" data-marketing-count="${day.date}">${count}</text>`;
  const description=`${day.date}: ${num(day[key])} ${unique?'unikátnych prehliadačov':'návštev'}${partial?', čiastočné meranie':''}`;
  return `<g class="marketing-chart-day" tabindex="${i===0?'0':'-1'}" role="img" aria-label="${esc(description)}" data-marketing-day="${day.date}" data-marketing-day-index="${i}"><title>${esc(description)}</title><rect class="chart-hit" x="${x}" y="${top-20}" width="${step}" height="${bottom-top+20}"/>${shapes}${totalLabel}${label}</g>`;
 }).join('');
 return `<div class="marketing-chart-scroll" tabindex="0" role="region" aria-label="Denná návštevnosť podľa zdroja; na úzkej obrazovke posúvajte vodorovne"><svg class="marketing-chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="Návštevnosť podľa zdroja" role="group">${axes}${bars}</svg></div>`;
}
export function chartContent(d,unique,sourceNames){
 const charts=d.charts,days=charts?.days||[],key=unique?'uniqueVisitors':'visits';
 const available=days.some(day=>day[key]!=null);
 const active=Object.keys(sourceNames).filter(source=>days.some(day=>day.sources.some(row=>row.source===source&&row[key]>0)));
 const caption=unique?'Unikátne prehliadače':'Návštevné relácie';
 const start=charts?.uniqueStartedAt?new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(charts.uniqueStartedAt):null;
 const empty=`<div class="marketing-chart-empty" role="status"><strong>Zatiaľ bez údajov</strong><p>${unique?`Unikátne prehliadače meriame${start?' od '+esc(start):' od zapnutia nového merania'}. Staršie návštevy sa spätne nerozlišujú.`:'Pre zvolené obdobie a filtre nemáme nameranú návštevnosť.'}</p></div>`;
 return `<figure class="marketing-chart"><figcaption><h3>Návštevnosť po dňoch a zdrojoch</h3><span>${caption} · Bratislava</span></figcaption>${active.length?`<ul class="marketing-chart-legend" aria-label="Zdroje návštevnosti">${active.map(source=>`<li><i class="chart-source-${source}" aria-hidden="true"></i>${esc(sourceNames[source])}</li>`).join('')}</ul>`:''}${available?chartSvg(days,unique):empty}${available?'<p class="marketing-chart-readout" aria-live="polite">Vyberte deň kurzorom, dotykom alebo šípkami na klávesnici.</p>':''}</figure>`;
}
export function bindChartDays(root,d,unique,sourceNames){
 scrollObserver?.disconnect();
 scrollObserver=new ResizeObserver(entries=>entries.forEach(({target})=>{if(!target.isConnected)scrollObserver.unobserve(target);else target.scrollLeft=Math.max(0,target.scrollWidth-target.clientWidth);}));
 root.querySelectorAll('.marketing-chart-scroll').forEach(element=>scrollObserver.observe(element));
 const key=unique?'uniqueVisitors':'visits';
 const reveal=target=>{
  const day=d.charts?.days.find(day=>day.date===target.dataset.marketingDay);if(!day)return;
  const sources=day.sources.filter(row=>row[key]>0).map(row=>sourceNames[row.source]+': '+num(row[key])).join(' · ');
  target.closest('figure').querySelector('.marketing-chart-readout').textContent=`${day.date} · ${unique?'Unikátne prehliadače':'Návštevy'}: ${num(day[key])}${sources?' · '+sources:''}${(unique?day.uniquePartial:day.partial)?' · čiastočné meranie':''}`;
 };
 root.querySelectorAll('[data-marketing-day]').forEach(target=>{
  target.addEventListener('pointerenter',()=>reveal(target));target.addEventListener('click',()=>reveal(target));target.addEventListener('focus',()=>reveal(target));
  target.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const all=[...target.closest('svg').querySelectorAll('[data-marketing-day]')],index=Number(target.dataset.marketingDayIndex),next=event.key==='Home'?0:event.key==='End'?all.length-1:Math.max(0,Math.min(all.length-1,index+(event.key==='ArrowRight'?1:-1)));all.forEach(el=>el.setAttribute('tabindex','-1'));all[next].setAttribute('tabindex','0');all[next].focus();});
 });
}
