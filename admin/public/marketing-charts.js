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
function chartSvg(days,unique,width=640,selected=days.length-1){
 const key=unique?'uniqueVisitors':'visits',height=width<600?152:218,left=34,right=12,top=16,bottom=height-27;
 const peak=Math.max(0,...days.flatMap(day=>day.sources.map(source=>source[key]||0)));
 const max=Math.max(2,Math.ceil(peak/2)*2),x=i=>days.length===1?(left+width-right)/2:left+i*(width-left-right)/(days.length-1),y=value=>bottom-value/max*(bottom-top);
 const compact=value=>new Intl.NumberFormat('sk-SK',{notation:'compact',maximumFractionDigits:1}).format(value);
 const axes=[0,max/2,max].map(value=>`<line class="chart-gridline" x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}"/><text class="chart-axis" x="${left-9}" y="${y(value)+4}" text-anchor="end">${compact(value)}</text>`).join('');
 const lines=sourceGroups.map(([source])=>{
  let path='',previous=false;
  const dots=[];
  days.forEach((day,i)=>{
   const value=day.sources.find(row=>row.source===source)?.[key];
   if(day[key]==null||value==null){previous=false;return;}
   path+=(previous?'L':'M')+x(i)+' '+y(value)+' ';previous=true;
   const isolated=(i===0||days[i-1][key]==null)&&(i===days.length-1||days[i+1][key]==null);
   if(isolated)dots.push(`<circle class="chart-source-${source} chart-point" cx="${x(i)}" cy="${y(value)}" r="3"/>`);
  });
  return `<path class="chart-line chart-source-${source}" d="${path.trim()}"/>${dots.join('')}`;
 }).join('');
 const ticks=[...new Set(Array.from({length:Math.min(4,days.length)},(_,i)=>Math.round(i*(days.length-1)/Math.max(1,Math.min(4,days.length)-1))))];
 const labels=ticks.map(i=>`<text class="chart-axis" x="${x(i)}" y="${height-5}" text-anchor="${i===0?'start':i===days.length-1?'end':'middle'}">${shortDate(days[i].date)}</text>`).join('');
 const targets=days.map((day,i)=>{
  const from=i===0?left:(x(i-1)+x(i))/2,to=i===days.length-1?width-right:(x(i)+x(i+1))/2;
  const description=`${day.date}: ${num(day[key])} ${unique?'unikátnych prehliadačov':'návštev'}${(unique?day.uniquePartial:day.partial)?', čiastočné meranie':''}`;
  return `<g class="marketing-chart-day" tabindex="${i===selected?'0':'-1'}" role="img" aria-label="${esc(description)}" data-marketing-day="${day.date}" data-marketing-day-index="${i}"><title>${esc(description)}</title><rect class="chart-hit" x="${from}" y="${top-8}" width="${Math.max(1,to-from)}" height="${bottom-top+16}"/></g>`;
 }).join('');
 const day=days[selected],markers=day[key]==null?'':`<line class="chart-selection-line" x1="${x(selected)}" x2="${x(selected)}" y1="${top}" y2="${bottom}"/>`+day.sources.map(source=>`<circle class="chart-point chart-source-${source.source}" cx="${x(selected)}" cy="${y(source[key]||0)}" r="3.5"/>`).join('');
 return `<svg class="marketing-chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="Denná návštevnosť podľa zdroja, čas v Bratislave. Vyberte deň dotykom alebo šípkami." role="group">${axes}${lines}${markers}${labels}${targets}</svg>`;
}
function measuredRange(d,unique){
 const key=unique?'uniqueVisitors':'visits',all=(d.charts?.days||[]).map(groupChartDay);
 const first=all.findIndex(day=>day[key]!=null),last=all.findLastIndex(day=>day[key]!=null);
 return {days:first<0?all:all.slice(first,last+1),trimmed:first>0};
}
const coverageText=(day,unique,range)=>day[unique?'uniqueVisitors':'visits']==null?'Bez merania':(unique?day.uniquePartial:day.partial)?'Čiastočné meranie':range.trimmed?'Meranie od '+shortDate(range.days[0].date):'';
const chosenIndex=days=>{const found=days.findIndex(day=>day.date===selectedDate);return found<0?days.length-1:found;};
function legend(day,key){
 return `<ul class="marketing-chart-legend" aria-label="Zdroje návštevnosti vo vybraný deň">${day.sources.map(source=>`<li data-chart-source="${source.source}" aria-label="${esc(source.label+': '+num(source[key]))}"><i class="chart-source-${source.source}" aria-hidden="true"></i><span>${esc(source.label)}</span><strong>${source[key]==null?'—':num(source[key])}</strong></li>`).join('')}</ul>`;
}
export function chartContent(d,unique){
 const charts=d.charts,range=measuredRange(d,unique),days=range.days,key=unique?'uniqueVisitors':'visits';
 const available=days.some(day=>day[key]!=null),selected=chosenIndex(days),day=days[selected];
 const caption=unique?'Unikátne prehliadače':'Návštevy';
 const start=charts?.uniqueStartedAt?new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(charts.uniqueStartedAt):null;
 const empty=`<div class="marketing-chart-empty" role="status"><strong>Zatiaľ bez údajov</strong><p>${unique?`Unikátne prehliadače meriame${start?' od '+esc(start):' od zapnutia nového merania'}. Staršie návštevy sa spätne nerozlišujú.`:'Pre zvolené obdobie a filtre nemáme nameranú návštevnosť.'}</p></div>`;
 if(!available)return `<figure class="marketing-chart"><figcaption class="sr-only">${caption} po dňoch a zdrojoch · Bratislava</figcaption>${empty}</figure>`;
 const coverage=coverageText(day,unique,range);
 return `<figure class="marketing-chart"><figcaption class="sr-only">${caption} po dňoch a zdrojoch · Bratislava</figcaption><div class="marketing-chart-readout" aria-live="polite" aria-atomic="true"><div class="marketing-chart-day-nav"><button type="button" data-chart-step="-1" aria-label="Predchádzajúci deň"${selected===0?' disabled':''}>‹</button><div><time datetime="${day.date}">${day.date.slice(8,10)}. ${day.date.slice(5,7)}. ${day.date.slice(0,4)}</time><small class="marketing-chart-coverage"${coverage?'':' hidden'}>${coverage}</small></div><button type="button" data-chart-step="1" aria-label="Nasledujúci deň"${selected===days.length-1?' disabled':''}>›</button></div><div class="marketing-chart-total"><strong data-marketing-count="${day.date}"${day[key]==null?' class="is-unavailable"':''}>${num(day[key])}</strong><span>${caption}</span></div></div><div class="marketing-chart-plot">${chartSvg(days,unique,640,selected)}</div>${legend(day,key)}</figure>`;
}
export function bindChartDays(root,d,unique){
 chartObserver?.disconnect();cancelAnimationFrame(chartFrame);
 const figure=root.querySelector('.marketing-chart'),plot=figure?.querySelector('.marketing-chart-plot');if(!plot)return;
 const range=measuredRange(d,unique),days=range.days,key=unique?'uniqueVisitors':'visits';let selected=chosenIndex(days),width=640;
 const draw=()=>{
  const hadFocus=plot.contains(document.activeElement);
  plot.innerHTML=chartSvg(days,unique,width,selected);
  if(hadFocus)plot.querySelector('[tabindex="0"]').focus({preventScroll:true});
 };
 const reveal=index=>{
  selected=Math.max(0,Math.min(days.length-1,index));const day=days[selected];selectedDate=day.date;
  const time=figure.querySelector('time');time.dateTime=day.date;time.textContent=`${day.date.slice(8,10)}. ${day.date.slice(5,7)}. ${day.date.slice(0,4)}`;
  const total=figure.querySelector('[data-marketing-count]');total.dataset.marketingCount=day.date;total.textContent=num(day[key]);total.classList.toggle('is-unavailable',day[key]==null);
  const note=coverageText(day,unique,range),coverage=figure.querySelector('.marketing-chart-coverage');coverage.hidden=!note;coverage.textContent=note;
  figure.querySelector('[data-chart-step="-1"]').disabled=selected===0;figure.querySelector('[data-chart-step="1"]').disabled=selected===days.length-1;
  figure.querySelector('.marketing-chart-legend').outerHTML=legend(day,key);draw();
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
