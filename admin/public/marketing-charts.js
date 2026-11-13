const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>value==null?'Nedostupné':new Intl.NumberFormat('sk-SK').format(value);
const shortDate=value=>value.slice(8,10)+'.'+value.slice(5,7)+'.';
export const sourceGroups=[['facebook','Facebook',['facebook_ads','facebook']],['instagram','Instagram',['instagram_ads','instagram']],['other','Others',['meta','direct','unknown','organic']]];
export function groupChartDay(day){
 const sources=sourceGroups.map(([source,label,keys])=>{
  const rows=day.sources.filter(row=>source==='other'?!sourceGroups.slice(0,2).some(([, ,members])=>members.includes(row.source)):keys.includes(row.source));
  const sum=key=>day[key]==null||rows.some(row=>row[key]==null)?null:rows.reduce((total,row)=>total+row[key],0);
  return {source,label,visits:sum('visits'),uniqueVisitors:sum('uniqueVisitors')};
 });
 // Source-level unique counts are already disjoint per day in the server report.
 return {...day,sources};
}
let chartObserver,chartFrame,selectedDate;
export function paymentLink(d){
 const params=new URLSearchParams({scope:'funnel',period:'custom',from:d.filters.from,to:d.filters.to,asOf:String(d.generatedAt)});
 for(const key of ['source','campaign','device','product'])if(d.filters[key])params.set(key,d.filters[key]);
 return '#payments?'+params;
}
function chartSvg(days,unique,width=640,selected=days.length-1,plain=false){
 const key=unique?'uniqueVisitors':'visits',height=width<600?152:218,left=30,right=8;
 const step=(width-left-right)/Math.max(1,days.length),barWidth=Math.min(27,step*.55);
 const longest=Math.max(1,...days.map(day=>String(day[key]??'').length));
 const vertical=step<longest*6+5,font=vertical?Math.max(5,Math.min(8,Math.floor(step))):10;
 // Dense labels point upward. Reserve room for staggered labels while keeping
 // every calendar slot and its bar within the actual container width.
 const headroom=vertical?Math.min(height*.48,longest*font*.65*(Math.ceil(font/step)+1)+10):24;
 const top=Math.max(26,headroom),showDates=step>=30,bottom=height-(showDates?25:9);
 const peak=Math.max(0,...days.map(day=>day[key]||0)),max=Math.max(2,Math.ceil(peak/2)*2);
 const x=i=>left+step*(i+.5),y=value=>bottom-value/max*(bottom-top);
 const compact=value=>new Intl.NumberFormat('sk-SK',{notation:'compact',maximumFractionDigits:1}).format(value);
 const axes=[0,max/2,max].map(value=>`<line class="chart-gridline" x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}"/><text class="chart-axis" x="${left-7}" y="${y(value)+4}" text-anchor="end">${compact(value)}</text>`).join('');
 const placed=[],totals=[];
 const bars=days.map((day,i)=>{
  const center=x(i),at=center-barWidth/2;
  let shapes='',total=0;
  if(day[key]!=null){
   for(const source of day.sources){const value=source[key]||0;if(value){shapes+=`<rect class="chart-bar chart-source-${source.source}" x="${at}" y="${y(total+value)}" width="${barWidth}" height="${value/max*(bottom-top)}"/>`;total+=value;}}
   if(!total)shapes=`<line class="chart-zero" x1="${at}" x2="${at+barWidth}" y1="${bottom}" y2="${bottom}"/>`;
  }
  const count=day[key]==null?'—':num(day[key]),labelHeight=vertical?count.length*font*.65:font;
  let labelY=(day[key]==null?bottom:y(day[key]))-5;
  if(vertical){
   for(let n=0;n<placed.length+1;n++){
    const collision=placed.find(p=>Math.abs(p.x-center)<font+1&&labelY>p.top-2&&labelY-labelHeight<p.bottom+2);
    if(!collision)break;labelY=collision.top-2;
   }
   placed.push({x:center,top:labelY-labelHeight,bottom:labelY});
  }
  const label=`<text class="chart-day-total${i===selected?' is-selected':''}${day[key]==null?' is-unavailable':''}" data-marketing-day-count="${day.date}" x="${center}" y="${labelY}" text-anchor="${vertical?'start':'middle'}" font-size="${font}"${vertical?` transform="rotate(-90 ${center} ${labelY})"`:''} aria-hidden="true">${count}</text>`;
  totals.push(label);
  const description=`${day.date}: ${num(day[key])} ${unique?'unikátnych prehliadačov':'návštev'}${(unique?day.uniquePartial:day.partial)?', čiastočné meranie':''}`;
  return `<g class="marketing-chart-day${i===selected?' is-selected':''}" tabindex="${i===selected?'0':'-1'}" role="img" aria-label="${esc(description)}" data-marketing-day="${day.date}" data-marketing-day-index="${i}"><title>${esc(description)}</title><rect class="chart-hit" x="${left+step*i}" y="0" width="${step}" height="${bottom+3}"/>${shapes}</g>`;
 }).join('');
 const ticks=showDates?[...new Set(Array.from({length:Math.min(4,days.length)},(_,i)=>Math.round(i*(days.length-1)/Math.max(1,Math.min(4,days.length)-1))))]:[];
 const labels=ticks.map(i=>`<text class="chart-axis chart-date" x="${x(i)}" y="${height-5}" text-anchor="middle">${shortDate(days[i].date)}</text>`).join('');
 return `<svg class="marketing-chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="Denná návštevnosť ${plain?'rodulab.com':'podľa zdroja'}, čas v Bratislave. Vyberte deň dotykom alebo šípkami." role="group">${axes}${bars}${totals.join('')}${labels}</svg>`;
}
function measuredRange(d,unique){
 const key=unique?'uniqueVisitors':'visits',all=(d.charts?.days||[]).map(day=>d.charts.site==='rodulab'?day:groupChartDay(day));
 const first=all.findIndex(day=>day[key]!=null),last=all.findLastIndex(day=>day[key]!=null);
 return {days:first<0?all:all.slice(first,last+1),trimmed:first>0};
}
const coverageText=(day,unique,range)=>day[unique?'uniqueVisitors':'visits']==null?'Bez merania':(unique?day.uniquePartial:day.partial)?'Čiastočné meranie':range.trimmed?'Meranie od '+shortDate(range.days[0].date):'';
const chosenIndex=days=>{const found=days.findIndex(day=>day.date===selectedDate);return found<0?days.length-1:found;};
function legend(day,key){
 return `<ul class="marketing-chart-legend" aria-label="Zdroje návštevnosti vo vybraný deň">${day.sources.map(source=>`<li data-chart-source="${source.source}" aria-label="${esc(source.label+': '+num(source[key]))}"><i class="chart-source-${source.source}" aria-hidden="true"></i><span>${esc(source.label)}</span><strong>${source[key]==null?'—':num(source[key])}</strong></li>`).join('')}</ul>`;
}
export function chartContent(d,unique){
 const charts=d.charts,plain=charts?.site==='rodulab',range=measuredRange(d,unique),days=range.days,key=unique?'uniqueVisitors':'visits';
 const available=days.some(day=>day[key]!=null),selected=chosenIndex(days),day=days[selected];
 const caption=unique?'Unikátne prehliadače':'Návštevy';
 const start=charts?.uniqueStartedAt?new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(charts.uniqueStartedAt):null;
 const studioStart=plain&&charts.startedAt?new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(charts.startedAt):null;
 const note=plain?`<p class="marketing-studio-note">Každé otvorenie rodulab.com je jedna návšteva. Opakované otvorenia sa počítajú znova. ${studioStart?'Meranie od '+esc(studioStart)+'. ':''}Filtre zdrojov a produktov sa na tento graf nevzťahujú.</p>`:'';
 const empty=`<div class="marketing-chart-empty" role="status"><strong>Zatiaľ bez údajov</strong><p>${plain?`Návštevy rodulab.com meriame${studioStart?' od '+esc(studioStart):' od zapnutia nového merania'}. Staršiu návštevnosť nepoznáme.`:unique?`Unikátne prehliadače meriame${start?' od '+esc(start):' od zapnutia nového merania'}. Staršie návštevy sa spätne nerozlišujú.`:'Pre zvolené obdobie a filtre nemáme nameranú návštevnosť.'}</p></div>`;
 if(!available)return `<figure class="marketing-chart"><figcaption class="sr-only">${caption} po dňoch a zdrojoch · Bratislava</figcaption>${empty}</figure>`;
 const coverage=coverageText(day,unique,range);
 return `<figure class="marketing-chart"><figcaption class="sr-only">${caption} ${plain?'rodulab.com po dňoch':'po dňoch a zdrojoch'} · Bratislava</figcaption><div class="marketing-chart-readout" aria-live="polite" aria-atomic="true"><div class="marketing-chart-day-nav"><button type="button" data-chart-step="-1" aria-label="Predchádzajúci deň"${selected===0?' disabled':''}>‹</button><div><time datetime="${day.date}">${day.date.slice(8,10)}. ${day.date.slice(5,7)}. ${day.date.slice(0,4)}</time><small class="marketing-chart-coverage"${coverage?'':' hidden'}>${coverage}</small></div><button type="button" data-chart-step="1" aria-label="Nasledujúci deň"${selected===days.length-1?' disabled':''}>›</button></div><div class="marketing-chart-total"><strong data-marketing-count="${day.date}"${day[key]==null?' class="is-unavailable"':''}>${num(day[key])}</strong><span>${caption}</span></div></div><div class="marketing-chart-plot">${chartSvg(days,unique,640,selected,plain)}</div>${plain?note:legend(day,key)}</figure>`;
}
export function bindChartDays(root,d,unique){
 chartObserver?.disconnect();cancelAnimationFrame(chartFrame);
 const figure=root.querySelector('.marketing-chart'),plot=figure?.querySelector('.marketing-chart-plot');if(!plot)return;
 const range=measuredRange(d,unique),days=range.days,key=unique?'uniqueVisitors':'visits';let selected=chosenIndex(days),width=640;
 const draw=()=>{
  const hadFocus=plot.contains(document.activeElement);
  plot.innerHTML=chartSvg(days,unique,width,selected,d.charts?.site==='rodulab');
  if(hadFocus)plot.querySelector('[tabindex="0"]').focus({preventScroll:true});
 };
 const reveal=index=>{
  selected=Math.max(0,Math.min(days.length-1,index));const day=days[selected];selectedDate=day.date;
  const time=figure.querySelector('time');time.dateTime=day.date;time.textContent=`${day.date.slice(8,10)}. ${day.date.slice(5,7)}. ${day.date.slice(0,4)}`;
  const total=figure.querySelector('[data-marketing-count]');total.dataset.marketingCount=day.date;total.textContent=num(day[key]);total.classList.toggle('is-unavailable',day[key]==null);
  const note=coverageText(day,unique,range),coverage=figure.querySelector('.marketing-chart-coverage');coverage.hidden=!note;coverage.textContent=note;
  figure.querySelector('[data-chart-step="-1"]').disabled=selected===0;figure.querySelector('[data-chart-step="1"]').disabled=selected===days.length-1;
  const sourceLegend=figure.querySelector('.marketing-chart-legend');if(sourceLegend)sourceLegend.outerHTML=legend(day,key);draw();
 };
 figure.querySelectorAll('[data-chart-step]').forEach(button=>button.addEventListener('click',()=>reveal(selected+Number(button.dataset.chartStep))));
 plot.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const target=event.target.closest('[data-marketing-day]');if(target&&Number(target.dataset.marketingDayIndex)!==selected)reveal(Number(target.dataset.marketingDayIndex));});
 plot.addEventListener('click',event=>{const target=event.target.closest('[data-marketing-day]');if(target)reveal(Number(target.dataset.marketingDayIndex));});
 plot.addEventListener('focusin',event=>{const target=event.target.closest('[data-marketing-day]');if(target&&Number(target.dataset.marketingDayIndex)!==selected)reveal(Number(target.dataset.marketingDayIndex));});
 plot.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
  reveal(event.key==='Home'?0:event.key==='End'?days.length-1:selected+(event.key==='ArrowRight'?1:-1));
  plot.querySelector('[tabindex="0"]').focus({preventScroll:true});
 });
 chartObserver=new ResizeObserver(entries=>entries.forEach(({contentRect})=>{const next=Math.floor(contentRect.width);if(next>=200&&next!==width){width=next;cancelAnimationFrame(chartFrame);chartFrame=requestAnimationFrame(()=>{if(plot.isConnected)draw();});}}));
 chartObserver.observe(plot);
}
