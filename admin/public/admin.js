const $=s=>document.querySelector(s);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>value==null?'—':new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(value);
const number=value=>value==null?'—':new Intl.NumberFormat('sk-SK',{maximumFractionDigits:1}).format(value);
const money=(cents,currency='EUR')=>new Intl.NumberFormat('sk-SK',{style:'currency',currency}).format(cents/100);
const time=ms=>ms==null?'—':ms>=3600000?number(ms/3600000)+' h':ms>=60000?number(ms/60000)+' min':number(ms/1000)+' s';
const stateNames={purchased:'Zakúpené, neaktivované',preparing:'Pripravuje hru',playing:'Rozhrané',completed:'Dokončené',expired:'Prístup vypršal',active:'Aktívna relácia',valid:'Platné',revoked:'Odňaté',pending:'Čaká na platbu','payment-pending':'Čaká na platbu',paid:'Zaplatené',refunded:'Vrátené',cancelled:'Zrušené',draft:'Koncept',blocked:'Blokované',queued:'Čaká na odoslanie',sent:'Odoslané',failed:'Chyba'};
const badge=status=>`<span class="status ${escape(status)}">${escape(stateNames[status]||status)}</span>`;
const titles={dashboard:['Overview','Zákazníci, tržby a priebeh hry na jednom mieste.'],orders:['Objednávky','Nákupy, produkty a platby zákazníkov Pixelkovia.'],analytics:['Herná analýza','Od prvého nákupu po poslednú stopu. Celý príbeh každého zákazníka.']};
const state={page:1,q:'',status:'',sort:'purchase',direction:'desc',version:'',portal:'',context:null,expanded:new Set(),details:new Map(),wide:false};
let loadingId=0,detailId=0,debounce;
async function api(path,params){const response=await fetch(path+(params?.toString()?'?'+params:''),{credentials:'same-origin'});const value=await response.json();if(response.status===401&&state.context?.authMode==='password'){document.querySelector('#view').replaceChildren();location.replace('/admin/login');throw Error('Prihlásenie vypršalo.');}if(!response.ok)throw Error(value.error||'Načítanie zlyhalo.');return value;}
function midnight(day){const utc=Date.parse(day+'T00:00:00Z');const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(utc).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));const represented=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));return new Date(utc-(represented-utc)).toISOString();}
function params(){const values=new URLSearchParams();if($('#from').value)values.set('from',midnight($('#from').value));if($('#to').value){const end=new Date($('#to').value+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);values.set('to',midnight(end.toISOString().slice(0,10)));}if($('#product').value)values.set('product',$('#product').value);return values;}

const empty=message=>`<div class="empty">${escape(message)}</div>`;
function table(headers,rows,cls=''){return rows.length?`<div class="table-wrap"><table class="${cls}"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(cells=>`<tr>${cells.map((cell,index)=>`<td data-label="${escape(headers[index])}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Pre zvolené filtre zatiaľ nie sú žiadne záznamy.');}
function chart(title,points,color=''){
  const max=Math.max(1,...points.map(p=>p.count));
  return `<article class="panel"><h2>${title}</h2><p class="caption">Vývoj v kohorte podľa dátumu nákupu · UTC dni</p>${points.length?`<div class="chart ${color}" role="img" aria-label="${escape(title+': '+points.map(p=>p.date+' '+p.count).join(', '))}">${points.map(p=>`<div class="bar-column"><span>${p.count}</span><div class="bar" data-height="${p.count/max*100}"></div><small>${escape(p.date.slice(5))}</small></div>`).join('')}</div><details><summary>Tabuľka dát</summary>${table(['Dátum UTC','Počet'],points.map(p=>[escape(p.date),p.count]))}</details>`:'<div class="chart-empty">Zatiaľ žiadne udalosti</div>'}</article>`;
}
function dashboard(data){
  const m=data.metrics,revenues=Object.entries(m.revenueByCurrency).map(([currency,cents])=>money(cents,currency)).join(' / ')||money(0);
  const metrics=[['Zákazníci',m.customers,'Unikátne zákaznícke ID'],['Zaplatené objednávky',m.paidOrders,'Unikátne objednávky'],['Tržby',revenues,'Zaplatené položky v kohorte'],['Zakúpené hry',m.purchasedGames,'Zakúpené oprávnenia'],['Neaktivované hry',m.unactivated,'Oprávnenia bez spustenia'],['Aktivované hry',m.activated,'Oprávnenia s aktiváciou'],['Rozhrané hry',m.playing,'Aktívne herné relácie'],['Dokončené hrania',m.completed,'Vrátane samostatných opakovaní'],['Priemerné dokončenie',time(m.meanCompletionMs),'Uplynutý čas dokončených relácií'],['Medián dokončenia',time(m.medianCompletionMs),'Uplynutý čas dokončených relácií']];
  return `<div class="metrics">${metrics.map(([label,value,note])=>`<article class="metric"><span class="label">${label}</span><strong>${typeof value==='number'?number(value):escape(value)}</strong><small>${note}</small></article>`).join('')}</div><div class="chart-grid">${chart('Nákupy v čase',data.charts.purchases)}${chart('Aktivácie v čase',data.charts.activations,'chart-mint')}${chart('Dokončenia v čase',data.charts.completions,'chart-amber')}</div><article class="panel"><h2>Sedem úloh. Jedna spoločná cesta.</h2><p class="caption">Priechod počítame po herných reláciách; každé opakovanie má vlastný priebeh.</p><div class="funnel">${data.funnel.map(s=>`<div class="funnel-cell"><strong>ÚLOHA ${s.stage.toString().padStart(2,'0')}</strong><span>${s.solved}</span><small>z ${s.started} začatých</small><div class="progress-track"><i data-width="${s.started?s.solved/s.started*100:0}"></i></div><p>${escape(s.title)}</p></div>`).join('')}</div></article><p class="definition">${escape(data.cohort)}</p>`;
}
function orders(rows){return table(['Objednávka','Zákazník','Produkty','Nákup','Suma','Platba'],rows.map(o=>[`<strong>${escape(o.id)}</strong>`,`<button class="link-button" data-customer="${escape(o.customer_id)}">${escape(o.customer_name)}</button><small>${escape(o.email)}</small>`,escape(o.products),date(o.created_at),`<strong class="order-total">${money(o.total_cents,o.currency)}</strong>`,badge(o.status)]))+`<p class="definition">Najnovších 200 objednávok vo vybranej kohorte. Platby sa overujú na serveri; každý nákup má samostatný prístup.</p>`;}
const checklistNames={printed:'Materiály stiahnuté a vytlačené',placed:'Materiály rozmiestnené po byte','device-understood':'Hra sa bude hrať na tomto telefóne'};
const eventNames={opened:'Otvorenie úlohy',heartbeat:'Aktivita v hre',hint:'Použitá nápoveda','wrong-answer':'Nesprávny pokus',solved:'Úloha vyriešená',completed:'Hra dokončená'};
const extensionNames={'story-book-before':'Ako vznikli Pixelkovia','story-book-after':'Po veľkom záblesku'};
const options=(list,value)=>list.map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${label}</option>`).join('');
function searchTools(){return `<div class="journey-filters search-tools"><label>Hľadať zákazníka<input id="customer-search" type="search" value="${escape(state.q)}" placeholder="Meno alebo e-mail"></label><label>Stav zákazníka<select id="customer-state">${options([['','Všetky stavy'],['active','Aktívni · nedokončené'],['purchased','Zakúpené · bez prípravy'],['preparing','Pripravuje hru'],['playing','Práve hrá'],['completed','Dokončené'],['expired','Prístup vypršal'],['payment-pending','Čaká na platbu']],state.status)}</select></label><label>Verzia hry<select id="customer-version">${options([['','Všetky verzie'],['base','Iba základná hra'],['extensions','S knihami'],['full','Obe knihy']],state.version)}</select></label><label>Customer page<select id="customer-portal">${options([['','Všetci zákazníci'],['opened','Už otvoril'],['unopened','Ešte neotvoril']],state.portal)}</select></label><label>Zoradenie<select id="customer-sort">${options([['purchase','Najnovší nákup'],['activity','Posledná aktivita'],['customer','Meno zákazníka'],['stage','Aktuálna úloha']],state.sort)}</select></label></div>`;}
function stars(c){const labels=[...(c.has_base?['Základná hra']:[]),...c.extension_ids.map(id=>extensionNames[id])];return `<span class="purchase-stars" role="img" aria-label="${escape(labels.join(', ')||'Bez zaplateného produktu')}" title="${escape(labels.join(' · '))}">${labels.map((label,i)=>`<span class="${i?'extension-star':'base-star'}" aria-hidden="true">★</span>`).join('')}</span>`;}
function journeySteps(c){return [
  {label:'Kúpil',kind:'purchase',done:c.has_base,at:c.purchase_at},
  {label:'Customer page',kind:'onboarding',done:c.portal_opened_at!=null,at:c.portal_opened_at},
  {label:'Spustil hru',kind:'onboarding',done:c.started_at!=null,at:c.started_at},
  ...c.stages.map(s=>({label:s.title,kind:'game',done:s.completed_at!=null,current:s.first_opened_at!=null&&s.completed_at==null,at:s.completed_at??s.first_opened_at})),
  {label:'Dokončil',kind:'finish',done:c.completed_at!=null,at:c.completed_at}
];}
function dot(s){const label=s.label+' · '+(s.done?'Hotovo':s.current?'Práve rieši':'Čaká')+(s.at!=null?' · '+date(s.at):'');return `<span class="journey-dot ${s.kind} ${s.done?'done':s.current?'current':'waiting'}" role="img" aria-label="${escape(label)}" title="${escape(label)}">${s.done?'✓':s.current?'•':''}</span>`;}
function analytics(data){
  const headers=['Kúpil','Customer page','Spustil hru',...data.stages.map(s=>s.title),'Dokončil'];
  let previousGroup='';
  const rows=data.rows.map((c,i)=>{
    const group=c.state==='completed'?'Dokončené':c.state==='expired'||c.state==='payment-pending'?'Ostatní zákazníci':'Aktívni zákazníci';
    const separator=group!==previousGroup?`<tr class="journey-group"><th colspan="14" scope="colgroup">${group}<span>${group==='Dokončené'?'Úspešne uzavreté dobrodružstvá':group==='Aktívni zákazníci'?'Majú pred sebou ďalší krok':''}</span></th></tr>`:'';previousGroup=group;
    const detailId='journey-detail-'+i,expanded=state.expanded.has(c.customer_id),cached=state.details.get(c.customer_id);
    return separator+`<tr class="journey-row ${expanded?'expanded':''}" data-row="${escape(c.customer_id)}"><td class="customer-cell"><button class="journey-toggle" data-journey="${escape(c.customer_id)}" aria-expanded="${expanded}" aria-controls="${detailId}"><span class="customer-avatar" aria-hidden="true">${escape(c.name.replace(/^FAKE · /,'').split(' ').map(v=>v[0]).slice(0,2).join(''))}</span><span class="customer-copy"><span class="customer-name">${escape(c.name)} ${stars(c)}</span><span class="customer-email">${escape(c.email)}</span></span></button></td>${journeySteps(c).map(step=>`<td class="step-cell">${dot(step)}</td>`).join('')}<td class="customer-status">${badge(c.state)}</td><td class="expand-cell" aria-hidden="true">${expanded?'−':'+'}</td></tr><tr class="journey-detail-row" id="${detailId}" ${expanded?'':'hidden'}><td colspan="14"><div class="inline-detail">${cached?detail(cached):'<p role="status">Načítavam detail zákazníka…</p>'}</div></td></tr>`;
  }).join('');
  return searchTools()+`<div class="journey-board ${state.wide?'is-wide':''}"><div class="journey-toolbar"><div><h2>Cesta zákazníkov <span class="count-pill">${data.total}</span></h2><p>Aktívni hore, dokončení dole. Kliknutím na zákazníka otvoríte detail.</p></div><button id="expand-analysis" class="button secondary" type="button" aria-pressed="${state.wide}">${state.wide?'↙ Zmenšiť':'⛶ Rozšíriť na celú šírku'}</button></div><div class="journey-legend"><span><i class="legend-dot amber"></i>Nákup a príprava</span><span><i class="legend-dot mint"></i>7 herných úloh</span><span><i class="legend-dot purple"></i>Dokončenie</span><span><i class="legend-dot outlined"></i>Čaká</span><span class="stars-legend">★ základná hra <b>★</b> každé rozšírenie</span></div>${data.rows.length?`<div class="journey-table-wrap"><table class="journey-table"><thead><tr><th scope="col">Zákazník</th>${headers.map((label,i)=>`<th scope="col" class="step-heading ${i<3?'onboarding':i===headers.length-1?'finish':'game'}"><span class="step-label">${escape(label)}</span><span class="step-number" title="${escape(label)}">${i<3?['Kúpa','Portál','Štart'][i]:i===headers.length-1?'Cieľ':i-2}</span></th>`).join('')}<th scope="col" class="status-heading">Stav</th><th scope="col"><span class="sr-only">Detail</span></th></tr></thead><tbody>${rows}</tbody></table></div>`:empty('Pre zvolené filtre nie sú žiadni zákazníci.')}<div class="table-meta"><span>${data.total} zákazníkov · ★ vychádzajú zo zaplatených produktov</span><div class="pager"><button class="button secondary" data-pagination="-1" ${data.page===1?'disabled':''}>← Predchádzajúca</button><span>${data.page} / ${Math.max(1,Math.ceil(data.total/data.pageSize))}</span><button class="button secondary" data-pagination="1" ${data.page*data.pageSize>=data.total?'disabled':''}>Nasledujúca →</button></div></div></div>`;
}
function facts(items){return `<dl class="detail-facts">${items.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;}
function detail(data){
  const p=data.portal,portalMs=p.visits.reduce((sum,v)=>sum+Math.max(0,v.last_at-v.started_at),0);
  const checks=data.checklist.filter(c=>c.completed),latestCheck=checks.length?Math.max(...checks.map(c=>c.updated_at)):null;
  const paid=data.orders.filter(o=>o.status==='paid'),firstPurchase=paid.length?Math.min(...paid.map(o=>o.created_at)):null;
  return `<div class="detail-summary"><span class="eyebrow">DETAIL ZÁKAZNÍKA</span><strong>${escape(data.customer.name)}</strong><span>${escape(data.customer.email)}</span></div><div class="detail-columns"><section class="detail-block"><h3>Nákup a príprava</h3>${facts([['Zakúpené',date(firstPurchase)],['Prvé otvorenie customer page',date(p.firstVisit)],['Od nákupu k otvoreniu',firstPurchase!=null&&p.firstVisit!=null?time(p.firstVisit-firstPurchase):'—'],['Návštevy rodičovskej stránky',number(p.count)],['Čas návštev ≈',p.count?time(portalMs):'—'],['Posledná návšteva',date(p.lastVisit)]])}<p class="caption">Čas návštev je interval medzi prvou a poslednou zaznamenanou aktivitou, vrátane prestávok.</p><details><summary>Aktivity na rodičovskej stránke · checklist ${checks.length}/${data.entitlements.length*13}</summary>${latestCheck!=null?`<p class="caption">Posledné potvrdenie ${date(latestCheck)}</p>`:''}${data.checklist.length?table(['Príprava','Stav','Zmenené'],data.checklist.map(c=>[escape(checklistNames[c.step_key]||c.step_key),c.completed?'✓ Hotovo':'Čaká',date(c.updated_at)])):empty('Zatiaľ bez zaznamenanej prípravy.')}${table(['Otvorenie','Posledná aktivita','Trvanie ≈'],p.visits.map(v=>[date(v.started_at),date(v.last_at),time(v.last_at-v.started_at)]))}</details></section><section class="detail-block"><h3>Zakúpené produkty</h3>${table(['Produkt','Dátum','Cena','Platba'],data.orders.map(o=>[escape(o.product_name),date(o.created_at),money(o.unit_price_cents*o.quantity,o.currency),badge(o.status)]))}${data.entitlements.length?`<details><summary>Prístupy a opakovania</summary>${data.entitlements.map(e=>facts([['Produkt',escape(e.product_id)],['Prvá aktivácia',date(e.activated_at)],['Prvé dokončenie',date(e.first_completed_at)],['Opakovanie do',date(e.replay_until)]])).join('')}</details>`:''}</section></div>${data.runs.map(run=>`<section class="detail-block run-detail"><div class="run-heading"><h3>Hranie ${run.run_number} ${badge(run.status)}</h3><span>${date(run.started_at)} → ${date(run.completed_at)}</span></div>${facts([['Spustenie hry',date(run.started_at)],['Od otvorenia customer page po štart',p.firstVisit!=null?time(run.started_at-p.firstVisit):'—'],['Trvanie hry',run.completed_at!=null?time(run.completed_at-run.started_at):'Prebieha'],['Posledná aktivita',date(run.last_at)]])}${table(['Úloha','Otvorená','Vyriešená','Trvanie','Aktívny čas ≈','Správne','Nesprávne','Nápovedy','Stav'],run.stages.map(s=>[`${s.stage}. ${escape(s.title)}`,date(s.first_opened_at),date(s.completed_at),s.completed_at!=null?time(s.completed_at-s.first_opened_at):'—',s.first_opened_at!=null?time(s.active_ms):'—',s.attempts!=null?Math.max(0,s.attempts-s.wrong_attempts):'—',s.wrong_attempts??'—',s.hints??'—',s.completed_at!=null?badge('completed'):s.first_opened_at!=null?badge('playing'):'Čaká']))}<p class="caption">Trvanie zahŕňa prestávky. Aktívny čas je odhad podľa zaznamenanej aktivity.</p></section>`).join('')||'<p class="caption">Zákazník ešte nespustil hru.</p>'}<details class="detail-block"><summary>E-maily <span class="count-pill">${data.email.length}</span></summary>${table(['Vytvorené','Šablóna','Stav','Odoslané'],data.email.map(e=>[date(e.created_at),escape(e.template_key),badge(e.status),date(e.sent_at)]))}${data.email.length?'':'<p class="caption">Zatiaľ bez e-mailových udalostí.</p>'}</details><details class="detail-block"><summary>História hry <span class="count-pill">${data.events.length}</span></summary>${table(['Čas','Udalosť','Úloha','Relácia'],data.events.map(e=>[date(e.occurred_at),escape(eventNames[e.type]||e.type),e.stage??'Finále',escape(e.run_id)]))}</details>`;
}
function currentView(){const hash=location.hash.slice(1);return ['customers','emails','events'].includes(hash)?'analytics':Object.hasOwn(titles,hash)?hash:'dashboard';}
async function load(){
  const id=++loadingId,view=currentView();
  $('#page-title').textContent=titles[view][0];$('#page-description').textContent=titles[view][1];$('#breadcrumb').textContent=titles[view][0];
  document.body.classList.toggle('analysis-wide',view==='analytics'&&state.wide);
  document.querySelectorAll('[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===view);if(a.dataset.page===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#notice').textContent='';$('#view').setAttribute('aria-busy','true');
  try{
    const p=params();if(view==='analytics'){p.set('view','journey');for(const [key,value] of Object.entries({page:state.page,q:state.q,state:state.status,sort:state.sort,direction:state.sort==='customer'?'asc':'desc',version:state.version,portal:state.portal}))p.set(key,value);}
    const data=await api('/api/admin/'+(view==='analytics'?'customers':view),p);if(id!==loadingId)return;
    const focused=document.activeElement?.id,selection=document.activeElement?.selectionStart;
    $('#view').innerHTML=({dashboard,orders,analytics})[view](data);state.page=data.page||state.page;
    if(view==='dashboard'){
      const reviews=await api('/api/admin/feedback');
      if(id!==loadingId)return;
      $('#view').insertAdjacentHTML('beforeend','<section class="panel"><h2>Hodnotenia hráčov</h2>'+table(['Hodnotenie','Rodina','Komentár','Dátum'],reviews.map(r=>[r.stars+' / 5 ★',escape(r.name),escape(r.comment),date(r.created_at)]))+'</section>');
    }
    document.querySelectorAll('[data-height]').forEach(e=>{e.style.height=Math.max(2,Math.min(75,Number(e.dataset.height)*.75))+'%';});
    document.querySelectorAll('[data-width]').forEach(e=>{e.style.width=e.dataset.width+'%';});
    if(focused==='customer-search'){$('#customer-search').focus({preventScroll:true});$('#customer-search').setSelectionRange(selection,selection);}
    for(const c of data.rows||[])if(state.expanded.has(c.customer_id)&&!state.details.has(c.customer_id))fetchInlineDetail(c.customer_id);
  }catch(error){if(id!==loadingId)return;$('#view').innerHTML=empty('Dáta sa nepodarilo načítať.');$('#notice').textContent=error.message;}
  finally{if(id===loadingId)$('#view').setAttribute('aria-busy','false');}
}
async function fetchInlineDetail(customerId){
  try{
    const data=await api('/api/admin/customers/'+encodeURIComponent(customerId));state.details.set(customerId,data);
    const row=[...document.querySelectorAll('[data-row]')].find(r=>r.dataset.row===customerId);
    if(row?.nextElementSibling)row.nextElementSibling.querySelector('.inline-detail').innerHTML=detail(data);
  }catch(error){
    const row=[...document.querySelectorAll('[data-row]')].find(r=>r.dataset.row===customerId);
    if(row?.nextElementSibling)row.nextElementSibling.querySelector('.inline-detail').innerHTML=empty(error.message)+'<button class="button secondary" data-retry="'+escape(customerId)+'">Skúsiť znova</button>';
  }
}
$('#filters').addEventListener('submit',e=>{e.preventDefault();state.page=1;load();});
$('#clear-filters').addEventListener('click',()=>{$('#filters').reset();Object.assign(state,{page:1,q:'',status:'',version:'',portal:'',sort:'purchase'});load();});
window.addEventListener('hashchange',()=>{state.page=1;load();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.wide){state.wide=false;document.body.classList.remove('analysis-wide');$('#view .journey-board')?.classList.remove('is-wide');const b=$('#expand-analysis');if(b){b.textContent='⛶ Rozšíriť na celú šírku';b.setAttribute('aria-pressed','false');b.focus();}}});
$('#view').addEventListener('input',e=>{if(e.target.id==='customer-search'){state.q=e.target.value;state.page=1;clearTimeout(debounce);debounce=setTimeout(load,300);}});
$('#view').addEventListener('change',e=>{const keys={'customer-state':'status','customer-sort':'sort','customer-version':'version','customer-portal':'portal'};if(keys[e.target.id]){clearTimeout(debounce);state[keys[e.target.id]]=e.target.value;state.page=1;load();}});
$('#view').addEventListener('click',async e=>{
  const pager=e.target.closest('[data-pagination]');if(pager){state.page+=Number(pager.dataset.pagination);load();return;}
  if(e.target.closest('#expand-analysis')){state.wide=!state.wide;document.body.classList.toggle('analysis-wide',state.wide);$('#view .journey-board').classList.toggle('is-wide',state.wide);const b=$('#expand-analysis');b.textContent=state.wide?'↙ Zmenšiť':'⛶ Rozšíriť na celú šírku';b.setAttribute('aria-pressed',String(state.wide));return;}
  const retry=e.target.closest('[data-retry]');if(retry){fetchInlineDetail(retry.dataset.retry);return;}
  const row=e.target.closest('[data-row]');if(row){
    const customerId=row.dataset.row,button=row.querySelector('[data-journey]'),expanded=button.getAttribute('aria-expanded')!=='true';
    if(expanded)state.expanded.add(customerId);else state.expanded.delete(customerId);
    row.classList.toggle('expanded',expanded);button.setAttribute('aria-expanded',String(expanded));row.querySelector('.expand-cell').textContent=expanded?'−':'+';row.nextElementSibling.hidden=!expanded;
    if(expanded&&!state.details.has(customerId))fetchInlineDetail(customerId);return;
  }
  const button=e.target.closest('[data-customer]');if(!button)return;
  const id=++detailId;$('#detail-content').innerHTML='<h2 id="detail-title">Detail zákazníka</h2><p>Načítavam…</p>';$('#detail').showModal();
  try{const data=await api('/api/admin/customers/'+encodeURIComponent(button.dataset.customer));if(id===detailId)$('#detail-content').innerHTML='<h2 id="detail-title">Detail zákazníka</h2>'+detail(data);}catch(error){if(id===detailId)$('#detail-content').innerHTML='<h2 id="detail-title">Detail zákazníka</h2>'+empty(error.message);}
});
$('#close-detail').addEventListener('click',()=>{detailId++;$('#detail').close();});
(async()=>{try{
  const context=await api('/api/admin/context');state.context=context;
  $('#identity-label').textContent=context.admin;
  if(context.authMode==='password'){
    $('#logout-button').hidden=false;
    $('#logout-button').addEventListener('click',async()=>{
      try{const response=await fetch('/api/admin/logout',{method:'POST',credentials:'same-origin'});if(!response.ok)throw Error('Odhlásenie sa nepodarilo.');location.replace('/admin/login');}catch(error){$('#notice').textContent=error.message;}
    });
  }
  $('#mode-label').textContent=context.environment==='local'?'Lokálne prostredie':context.authMode==='password'?'Prihlásenie heslom':'Overené cez Cloudflare Access';
  if(context.environment==='local'){$('#environment-banner').hidden=false;$('#environment-banner').textContent=context.demo?'LOKÁLNE DEMO · Všetci zákazníci, nákupy a herné relácie sú fiktívne testovacie údaje.':'LOKÁLNY TEST · Bez produkčného prihlásenia. Prázdne dáta sa nenahrádzajú demo zákazníkmi.';}
  if(context.fakeCustomers>0){$('#environment-banner').hidden=false;$('#environment-banner').textContent=`FAKE ÚDAJE · Databáza obsahuje ${context.fakeCustomers} fiktívnych zákazníkov. Prehľady zahŕňajú ich simulované nákupy, tržby a hrania. Nejde o skutočné platby.`;}
  if(context.webUrl){const base=new URL(context.webUrl);if(base.protocol==='https:')$('#external-links').innerHTML=[['Funnel','/'],['Supervisor','/Supervisor'],['Storyboard','/admin/storyboard']].map(([label,path])=>`<a href="${escape(new URL(path,base).href)}" target="_blank" rel="noopener noreferrer">${label} <span>↗</span></a>`).join('');}
  const products=await api('/api/admin/products');$('#product').insertAdjacentHTML('beforeend',products.map(p=>`<option value="${escape(p.id)}">${escape(p.name)}</option>`).join(''));
  await load();
}catch(error){$('#notice').textContent=error.message;$('#view').innerHTML=empty('Administrátorské prihlásenie alebo konfigurácia nie sú dostupné.');$('#view').setAttribute('aria-busy','false');}})();
